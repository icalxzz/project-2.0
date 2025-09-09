#include <Adafruit_Fingerprint.h>
#include <SoftwareSerial.h>

SoftwareSerial mySerial(2, 3); // RX=2, TX=3
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);

void setup() {
  Serial.begin(9600);
  while (!Serial);  // hapus angka 2 di sini

  Serial.println("Cek sensor sidik jari AS608...");
  finger.begin(57600);  // default AS608 biasanya 57600

  if (finger.verifyPassword()) {
    Serial.println("Sensor ditemukan!");
    finger.getParameters();
    Serial.print("Kapasitas: "); Serial.println(finger.capacity);
    Serial.print("Security level: "); Serial.println(finger.security_level);
  } else {
    Serial.println("Sensor tidak terdeteksi :(");
    while (1) delay(1);
  }
}


void loop() {
  Serial.println("\nMenu:");
  Serial.println("1 - Enroll jari baru");
  Serial.println("2 - Verifikasi jari");
  Serial.println("3 - Hapus jari (per ID)");
  Serial.print("Pilih (ketik angka lalu Enter): ");

  while (!Serial.available());
  int pilihan = Serial.parseInt();  // baca angka utuh

  if (pilihan == 1) {
    enrollFinger();
  } else if (pilihan == 2) {
    getFingerprintID();
  } else if (pilihan == 3) {
    deleteFinger();
  } else {
    Serial.println("Pilihan tidak valid!");
  }
}

// === Fungsi Enroll Sidik Jari ===
void enrollFinger() {
  int id;
  Serial.println("Masukkan ID (1-127): ");
  while (!Serial.available());
  id = Serial.parseInt();

  if (id < 1 || id > 127) {
    Serial.println("ID tidak valid!");
    return;
  }

  Serial.print("Enroll ID #");
  Serial.println(id);

  while (!getFingerprintEnroll(id));
}

// === Fungsi Verifikasi Sidik Jari ===
void getFingerprintID() {
  Serial.println("Letakkan jari anda...");
  while (finger.getImage() != FINGERPRINT_OK);

  if (finger.image2Tz() != FINGERPRINT_OK) {
    Serial.println("Gagal konversi citra");
    return;
  }

  if (finger.fingerFastSearch() != FINGERPRINT_OK) {
    Serial.println("Jari tidak dikenal");
    return;
  }

  // Jika cocok
  Serial.print("Cocok dengan ID #"); Serial.println(finger.fingerID);
  Serial.print("Confidence: "); Serial.println(finger.confidence);
}

// === Fungsi Hapus Sidik Jari ===
void deleteFinger() {
  Serial.println("Masukkan ID yang ingin dihapus (1-127): ");
  while (!Serial.available());
  int id = Serial.parseInt();

  if (id < 1 || id > 127) {
    Serial.println("ID tidak valid!");
    return;
  }

  Serial.print("Menghapus ID #"); Serial.println(id);
  if (finger.deleteModel(id) == FINGERPRINT_OK) {
    Serial.println("Berhasil dihapus!");
  } else {
    Serial.println("Gagal menghapus (ID kosong atau error)");
  }
}

// === Proses Enroll (2x scan jari) ===
uint8_t getFingerprintEnroll(int id) {
  int p = -1;
  Serial.println("Letakkan jari pertama...");
  while (p != FINGERPRINT_OK) {
    p = finger.getImage();
  }

  finger.image2Tz(1);
  Serial.println("Angkat jari..."); delay(2000);

  p = 0;
  while (p != FINGERPRINT_NOFINGER) {
    p = finger.getImage();
  }

  Serial.println("Letakkan jari lagi...");
  p = -1;
  while (p != FINGERPRINT_OK) {
    p = finger.getImage();
  }

  finger.image2Tz(2);
  if (finger.createModel() != FINGERPRINT_OK) {
    Serial.println("Gagal membuat model");
    return 0;
  }

  if (finger.storeModel(id) == FINGERPRINT_OK) {
    Serial.println("Sukses disimpan!");
    return 1;
  } else {
    Serial.println("Gagal menyimpan");
    return 0;
  }
}
