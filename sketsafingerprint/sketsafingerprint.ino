#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "time.h"
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_Fingerprint.h>  // Library fingerprint

// ---------------- OLED ----------------
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// ---------------- WiFi & Firebase ----------------
const char* ssid = "Faishal";
const char* password = "faishal5";

// Firestore
const char* FIRESTORE_PROJECT_ID = "student-attendance-database";
const char* FIRESTORE_API_KEY = "AIzaSyD9Edv1SvittW_kd5bczY7pIO7G08JZNo4";

// Realtime Database
const char* FIREBASE_RTDB_URL = "https://student-attendance-database-default-rtdb.asia-southeast1.firebasedatabase.app";

#define MAX_ID_LENGTH 20
volatile char idInputBuffer[MAX_ID_LENGTH];
volatile bool newDataReady = false;

// ---------------- NTP ----------------
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 25200; // GMT+7
const int daylightOffset_sec = 0;
bool ntpAvailable = false;

// ---------------- WiFi Signal ----------------
void drawWiFiSignal() {
  int32_t rssi = WiFi.RSSI();
  int bars = 0;
  if (rssi > -55) bars = 4;
  else if (rssi > -65) bars = 3;
  else if (rssi > -75) bars = 2;
  else if (rssi > -85) bars = 1;

  int x = 110, y = 0;
  int barWidth = 3, barHeight = 3;
  for (int i = 0; i < 4; i++) {
    if (i < bars) display.fillRect(x + i * (barWidth + 1), y + (10 - (i + 1) * barHeight), barWidth, (i + 1) * barHeight, SSD1306_WHITE);
    else display.drawRect(x + i * (barWidth + 1), y + (10 - (i + 1) * barHeight), barWidth, (i + 1) * barHeight, SSD1306_WHITE);
  }
}

// ---------------- LCD Display ----------------
void showLCD(const String& line1, const String& line2 = "") {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println(line1);
  if (line2.length() > 0) {
    display.setCursor(0, 16);
    display.println(line2);
  }
  drawWiFiSignal();
  display.display();
}

// ---------------- Firestore Check ----------------
bool checkStudentInFirestore(const String& id, String& nama, String& kelas) {
  HTTPClient http;
  String url = String("https://firestore.googleapis.com/v1/projects/") + FIRESTORE_PROJECT_ID + "/databases/(default)/documents/siswa/" + id + "?key=" + FIRESTORE_API_KEY;
  http.begin(url);
  int code = http.GET();
  if (code == 200) {
    String payload = http.getString();
    StaticJsonDocument<512> doc;
    if (deserializeJson(doc, payload) == DeserializationError::Ok) {
      if (doc.containsKey("fields")) {
        nama = doc["fields"]["nama"]["stringValue"] | String("Unknown");
        kelas = doc["fields"]["kelas"]["stringValue"] | String("Unknown");
        http.end();
        return true;
      }
    }
  }
  http.end();
  return false;
}

// ---------------- Task Database (RTDB) ----------------
void taskDatabaseOps(void * pvParameters) {
  while (WiFi.status() != WL_CONNECTED) vTaskDelay(1000 / portTICK_PERIOD_MS);

  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  struct tm timeinfo;
  int ntpRetry = 0;
  ntpAvailable = false;
  while (ntpRetry < 10) {
    if (getLocalTime(&timeinfo)) {
      ntpAvailable = true;
      break;
    }
    showLCD("Menunggu NTP...");
    vTaskDelay(1000 / portTICK_PERIOD_MS);
    ntpRetry++;
  }

  showLCD("Scan Sidik Jari");

  for (;;) {
    if (newDataReady) {
      String id = String((char*)idInputBuffer);
      id.trim();
      showLCD("Memproses ID", id);

      // Firestore verification
      String nama, kelas;
      if (!checkStudentInFirestore(id, nama, kelas)) {
        showLCD("ID tidak ada", id);
        vTaskDelay(1500 / portTICK_PERIOD_MS);
        showLCD("Scan Sidik Jari");
        newDataReady = false;
        continue;
      }

      // Get time
      bool haveTime = false;
      if (ntpAvailable) {
        if (getLocalTime(&timeinfo)) haveTime = true;
      }
      String tanggal = haveTime ? String(2025) + "-" + String(timeinfo.tm_mon+1) + "-" + String(timeinfo.tm_mday) : "0000-00-00";
      String jam = haveTime ? String(timeinfo.tm_hour) + ":" + String(timeinfo.tm_min) + ":" + String(timeinfo.tm_sec) : "00:00:00";

      String statusKehadiran = "tepat waktu";
      if (haveTime && (timeinfo.tm_hour > 7 || (timeinfo.tm_hour==7 && timeinfo.tm_min>0))) statusKehadiran = "telat";

      // Check RTDB
      HTTPClient httpCheck;
      String checkUrl = String(FIREBASE_RTDB_URL) + "/absensi/" + tanggal + "/" + id + ".json?auth=" + FIRESTORE_API_KEY;
      httpCheck.begin(checkUrl);
      int checkCode = httpCheck.GET();
      if (checkCode == 200) {
        String checkPayload = httpCheck.getString();
        if (checkPayload != "null") {
          showLCD("Sudah absen", id);
          httpCheck.end();
          vTaskDelay(1500 / portTICK_PERIOD_MS);
          showLCD("Scan Sidik Jari");
          newDataReady = false;
          continue;
        }
      }
      httpCheck.end();

      // Catat ke RTDB
      HTTPClient httpPost;
      String rtdbUrl = String(FIREBASE_RTDB_URL) + "/absensi/" + tanggal + "/" + id + ".json?auth=" + FIRESTORE_API_KEY;
      httpPost.begin(rtdbUrl);
      httpPost.addHeader("Content-Type", "application/json");

      String jsonPayload = "{"
                           "\"id\": \"" + id + "\","
                           "\"nama\": \"" + nama + "\","
                           "\"kelas\": \"" + kelas + "\","
                           "\"tanggal\": \"" + tanggal + "\","
                           "\"waktu\": \"" + jam + "\","
                           "\"status_kehadiran\": \"" + statusKehadiran + "\""
                           "}";

      int postCode = httpPost.PUT(jsonPayload);
      if (postCode > 0 && (postCode == HTTP_CODE_OK || postCode == HTTP_CODE_NO_CONTENT)) {
        showLCD("Selamat Pagi", nama);
      } else {
        showLCD("Gagal absen", id);
      }
      httpPost.end();

      vTaskDelay(1500 / portTICK_PERIOD_MS);
      showLCD("Scan Sidik Jari");
      newDataReady = false;
    }
    vTaskDelay(100 / portTICK_PERIOD_MS);
  }
}

// ---------------- Fingerprint ----------------
HardwareSerial mySerial(2); // UART2
Adafruit_Fingerprint finger(&mySerial);

uint8_t getFingerprintID() {
  uint8_t p = finger.getImage();
  if (p != FINGERPRINT_OK) return 0;

  p = finger.image2Tz();
  if (p != FINGERPRINT_OK) return 0;

  p = finger.fingerFastSearch();
  if (p != FINGERPRINT_OK) return 0;

  return finger.fingerID;
}

// ---------------- Setup ----------------
void setup() {
  Serial.begin(115200);
  mySerial.begin(57600, SERIAL_8N1, 16, 17); // RX=16, TX=17

  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) { for(;;); }

  showLCD("Menghubungkan", "WiFi...");
  WiFi.begin(ssid, password);
  int wifiWait = 0;
  while (WiFi.status() != WL_CONNECTED && wifiWait < 30) { delay(500); wifiWait++; }
  if (WiFi.status() == WL_CONNECTED) showLCD("WiFi Terhubung", WiFi.localIP().toString());
  else showLCD("Gagal WiFi!");

  // Inisialisasi fingerprint
  finger.begin(57600); // ✅ harus pakai baud rate
  if (finger.verifyPassword()) {
    showLCD("Sensor Fingerprint", "Siap scan");
  } else {
    showLCD("Sensor Fingerprint", "Gagal!");
    while (1) delay(1000);
  }

  // Jalankan task database
  xTaskCreatePinnedToCore(taskDatabaseOps, "DatabaseOpsTask", 12000, NULL, 1, NULL, 0);
}

// ---------------- Loop ----------------
void loop() {
  uint8_t id = getFingerprintID();
  if (id != 0) {
    String idStr = String(id);
    idStr.toCharArray((char*)idInputBuffer, sizeof(idInputBuffer));
    newDataReady = true;
  }
  delay(200);
}
