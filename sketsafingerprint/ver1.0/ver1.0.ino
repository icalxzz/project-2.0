#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "time.h"
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_Fingerprint.h>

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

// ---------------- Button ----------------
#define BUTTON_PIN 19

// ---------------- Fingerprint ----------------
HardwareSerial mySerial(2); // UART2
Adafruit_Fingerprint finger(&mySerial);

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

  String url = String("https://firestore.googleapis.com/v1/projects/") +
               FIRESTORE_PROJECT_ID +
               "/databases/(default)/documents/siswa/" +
               id +
               "?key=" + FIRESTORE_API_KEY;

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
        return true;  // Data ditemukan
      }
    }
  }
  http.end();
  return false;       // Data tidak ada
}

// ---------------- Fingerprint Functions ----------------
void enrollFingerprint(int customID) {
  int p = -1;
  showLCD("Daftar Finger", "Tempel jari...");
  while (p != FINGERPRINT_OK) {
    p = finger.getImage();
    delay(50);
  }
  if (finger.image2Tz(1) != FINGERPRINT_OK) {
    showLCD("Daftar Gagal", "Step1 error");
    return;
  }

  showLCD("Angkat jari", "Ulangi...");
  delay(2000);

  p = -1;
  while (p != FINGERPRINT_OK) {
    p = finger.getImage();
    delay(50);
  }
  if (finger.image2Tz(2) != FINGERPRINT_OK) {
    showLCD("Daftar Gagal", "Step2 error");
    return;
  }

  if (finger.createModel() != FINGERPRINT_OK) {
    showLCD("Daftar Gagal", "CreateModel");
    return;
  }

  if (finger.storeModel(customID) == FINGERPRINT_OK) {
    showLCD("Daftar Sukses!", "ID: " + String(customID));
  } else {
    showLCD("Gagal Simpan", "ID: " + String(customID));
  }
  delay(2000);
  showLCD("Scan Sidik Jari");
}

void deleteFingerprint(int id) {
  if (finger.deleteModel(id) == FINGERPRINT_OK) {
    showLCD("Hapus Sukses!", "ID: " + String(id));
  } else {
    showLCD("Hapus Gagal", "ID: " + String(id));
  }
  delay(2000);
  showLCD("Scan Sidik Jari");
}

void verifyFingerprint(int id) {
  showLCD("Verifikasi", "Tempel jari...");
  while (finger.getImage() != FINGERPRINT_OK);
  if (finger.image2Tz() != FINGERPRINT_OK) {
    showLCD("Verifikasi Gagal", "Convert error");
    return;
  }
  if (finger.fingerFastSearch() != FINGERPRINT_OK) {
    showLCD("Tidak Cocok");
    return;
  }
  if (finger.fingerID == id) {
    showLCD("Verifikasi OK", "ID: " + String(id));
  } else {
    showLCD("Verifikasi Gagal", "ID salah");
  }
  delay(2000);
  showLCD("Scan Sidik Jari");
}

void clearAllFingerprints() {
  Serial.println("Konfirmasi hapus semua data? (Y/N)");
  while (!Serial.available());
  char confirm = Serial.read();
  if (confirm == 'Y' || confirm == 'y') {
    if (finger.emptyDatabase() == FINGERPRINT_OK) {
      showLCD("Semua Data", "Berhasil Dihapus");
      Serial.println("Semua fingerprint terhapus dari sensor.");
    } else {
      showLCD("Clear All Gagal");
      Serial.println("Gagal menghapus semua fingerprint.");
    }
  } else {
    Serial.println("Batal hapus semua data.");
  }
  delay(2000);
  showLCD("Scan Sidik Jari");
}

// ---------------- Database Task (Core 0) ----------------
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

// ---------------- Fingerprint Task (Core 1) ----------------
uint8_t getFingerprintID() {
  uint8_t p = finger.getImage();
  if (p != FINGERPRINT_OK) return 0;
  p = finger.image2Tz();
  if (p != FINGERPRINT_OK) return 0;
  p = finger.fingerFastSearch();
  if (p != FINGERPRINT_OK) return 0;
  return finger.fingerID;
}

void taskFingerprintOps(void * pvParameters) {
  for (;;) {
    if (digitalRead(BUTTON_PIN) == LOW) {
      Serial.println("\nMenu Fingerprint:");
      Serial.println("1. Enroll (daftar sidik jari)");
      Serial.println("2. Delete (hapus sidik jari)");
      Serial.println("3. Verify (verifikasi sidik jari)");
      Serial.println("4. Clear All (hapus semua data)");
      Serial.println("Pilih mode: ");
      while (!Serial.available()) vTaskDelay(100 / portTICK_PERIOD_MS);
      int mode = Serial.parseInt();

      if (mode == 1) {
        Serial.println("Masukkan ID untuk daftar:");
        while (!Serial.available()) vTaskDelay(100 / portTICK_PERIOD_MS);
        int customID = Serial.parseInt();
        enrollFingerprint(customID);
      } else if (mode == 2) {
        Serial.println("Masukkan ID untuk hapus:");
        while (!Serial.available()) vTaskDelay(100 / portTICK_PERIOD_MS);
        int customID = Serial.parseInt();
        deleteFingerprint(customID);
      } else if (mode == 3) {
        Serial.println("Masukkan ID untuk verifikasi:");
        while (!Serial.available()) vTaskDelay(100 / portTICK_PERIOD_MS);
        int customID = Serial.parseInt();
        verifyFingerprint(customID);
      } else if (mode == 4) {
        clearAllFingerprints();
      }
    } else {
      // Mode absensi normal
      uint8_t id = getFingerprintID();
      if (id != 0) {
        String idStr = String(id);
        idStr.toCharArray((char*)idInputBuffer, sizeof(idInputBuffer));
        newDataReady = true;
      }
    }
    vTaskDelay(200 / portTICK_PERIOD_MS);
  }
}

// ---------------- Setup ----------------
void setup() {
  Serial.begin(115200);
  mySerial.begin(57600, SERIAL_8N1, 16, 17); // RX=16, TX=17
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) { for(;;); }

  showLCD("Menghubungkan", "WiFi...");
  WiFi.begin(ssid, password);
  int wifiWait = 0;
  while (WiFi.status() != WL_CONNECTED && wifiWait < 30) { delay(500); wifiWait++; }
  if (WiFi.status() == WL_CONNECTED) showLCD("WiFi Terhubung", WiFi.localIP().toString());
  else showLCD("Gagal WiFi!");

  // Inisialisasi fingerprint
  finger.begin(57600);
  if (finger.verifyPassword()) {
    showLCD("Sensor Fingerprint", "Siap scan");
  } else {
    showLCD("Sensor Fingerprint", "Gagal!");
    while (1) delay(1000);
  }

  // Jalankan task di core berbeda
  xTaskCreatePinnedToCore(taskDatabaseOps, "DatabaseOpsTask", 12000, NULL, 1, NULL, 0); // Core 0
  xTaskCreatePinnedToCore(taskFingerprintOps, "FingerprintOpsTask", 12000, NULL, 1, NULL, 1); // Core 1
}

void loop() {
  // Kosong, karena semua sudah pakai task
}
