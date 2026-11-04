package ru.bumbari.patterns

import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URI
import java.net.URL
import java.security.MessageDigest

data class AppUpdate(val versionCode: Long, val versionName: String, val packageName: String, val apkUrl: String, val sha256: String)

object AppUpdateClient {
    const val manifestUrl = "https://github.com/zelimhan2332/bumbari-preview/releases/latest/download/update.json"
    private const val maxApkBytes = 100L * 1024 * 1024

    fun parseManifest(text: String, expectedPackage: String): AppUpdate {
        require(text.length <= 32768) { "Файл обновления слишком большой" }
        val json = JSONObject(text)
        val version = json.getLong("versionCode")
        val name = json.getString("versionName")
        val packageName = json.getString("packageName")
        val apkUrl = json.getString("apkUrl")
        val sha = json.getString("sha256").lowercase()
        require(version > 0 && name.length in 1..40) { "Неверная версия обновления" }
        require(packageName == expectedPackage) { "Обновление предназначено для другого приложения" }
        val uri = URI(apkUrl)
        require(uri.scheme == "https" && uri.host == "github.com" && uri.path.startsWith("/zelimhan2332/bumbari-preview/releases/download/")) {
            "Файл обновления должен быть размещён в выпусках Bumbari"
        }
        require(sha.matches(Regex("[0-9a-f]{64}"))) { "Неверная контрольная сумма обновления" }
        return AppUpdate(version, name, packageName, apkUrl, sha)
    }

    fun currentUpdate(currentVersionCode: Long, expectedPackage: String): AppUpdate? {
        val text = request(URL(manifestUrl), 32768).toString(Charsets.UTF_8)
        val update = parseManifest(text, expectedPackage)
        return update.takeIf { it.versionCode > currentVersionCode }
    }

    fun download(update: AppUpdate, cacheDir: File): File {
        val directory = File(cacheDir, "updates").apply { mkdirs() }
        val partial = File(directory, "bumbari-update.apk.part")
        val target = File(directory, "bumbari-update.apk")
        val connection = (URL(update.apkUrl).openConnection() as HttpURLConnection).apply {
            connectTimeout = 20000; readTimeout = 30000; instanceFollowRedirects = true
            setRequestProperty("User-Agent", "Bumbari-Android")
        }
        val digest = MessageDigest.getInstance("SHA-256")
        try {
            require(connection.responseCode == HttpURLConnection.HTTP_OK) { "Сервер не отдал файл обновления" }
            require(connection.contentLengthLong in 0..maxApkBytes) { "Размер APK превышает допустимый предел" }
            connection.inputStream.use { input -> FileOutputStream(partial).use { output ->
                val buffer = ByteArray(8192); var total = 0L
                while (true) {
                    val count = input.read(buffer); if (count < 0) break
                    total += count; require(total <= maxApkBytes) { "Размер APK превышает допустимый предел" }
                    digest.update(buffer, 0, count); output.write(buffer, 0, count)
                }
                output.fd.sync()
            } }
            val actual = digest.digest().joinToString("") { "%02x".format(it) }
            require(actual == update.sha256) { "Контрольная сумма APK не совпала" }
            if (target.exists()) target.delete()
            require(partial.renameTo(target)) { "Не удалось подготовить APK к установке" }
            return target
        } catch (error: Throwable) {
            partial.delete()
            throw error
        } finally { connection.disconnect() }
    }

    private fun request(url: URL, maxBytes: Int): ByteArray {
        val connection = (url.openConnection() as HttpURLConnection).apply {
            connectTimeout = 15000; readTimeout = 20000; instanceFollowRedirects = true
            setRequestProperty("User-Agent", "Bumbari-Android")
        }
        try {
            require(connection.responseCode == HttpURLConnection.HTTP_OK) { "Пока нет опубликованного обновления" }
            val out = java.io.ByteArrayOutputStream(); connection.inputStream.use { input ->
                val buffer = ByteArray(4096); var total = 0
                while (true) { val count = input.read(buffer); if (count < 0) break; total += count; require(total <= maxBytes) { "Файл обновления слишком большой" }; out.write(buffer,0,count) }
            }
            return out.toByteArray()
        } finally { connection.disconnect() }
    }
}
