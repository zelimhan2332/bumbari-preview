package ru.bumbari.patterns

import org.json.JSONObject
import java.util.UUID

enum class Model(val title: String) {
    HALF("Полусолнце · 90° на сгибе"), FULL("Солнце · два полотнища 180°"), GORES("Четыре клина");
    val algorithm get() = "android-${name.lowercase()}-1"
}
data class Project(
    val id: String = UUID.randomUUID().toString(), val model: Model,
    val name: String = "", val notes: String = "",
    val waist: Double, val hip: Double, val hipHeight: Double, val length: Double,
    val waistEase: Double = 1.0, val hipEase: Double = 2.0, val expansion: Double = 3.0,
    val seam: Double = 1.0, val hem: Double = 1.0, val belt: Double = 3.0, val zip: Double = 20.0,
    val algorithm: String = model.algorithm
) {
    fun validate() {
        require(id.matches(Regex("[a-zA-Z0-9-]{1,80}"))) { "Повреждён идентификатор" }
        require(name.length <= 100 && notes.length <= 20000) { "Слишком длинный текст" }
        require(algorithm == model.algorithm) { "Неподдерживаемая версия алгоритма" }
        fun range(v: Double, a: Double, b: Double) = require(v.isFinite() && v in a..b) { "Мерки или настройки вне диапазона" }
        range(waist,40.0,180.0); range(hip,60.0,200.0); range(hipHeight,10.0,40.0); range(length,20.0,140.0)
        require(hip > waist && hipHeight < length) { "Проверьте соотношение мерок" }
        range(waistEase,0.0,4.0); range(hipEase,0.0,8.0); range(expansion,0.0,10.0)
        range(seam,0.5,2.0); range(hem,0.5,4.0); range(belt,2.0,5.0); range(zip,10.0,35.0)
        require(zip <= length - 2) { "Молния должна заканчиваться выше низа минимум на 2 см" }
    }
    fun json(): String {
        validate()
        return JSONObject().put("format","bumbari-android").put("version",1).put("units","cm")
            .put("id",id).put("model",model.name).put("algorithm",algorithm).put("name",name).put("notes",notes)
            .apply { numbers().forEach { (k,v) -> put(k,v) } }.toString(2)
    }
    fun numbers() = linkedMapOf("waist" to waist,"hip" to hip,"hipHeight" to hipHeight,"length" to length,
        "waistEase" to waistEase,"hipEase" to hipEase,"expansion" to expansion,"seam" to seam,"hem" to hem,"belt" to belt,"zip" to zip)
    companion object {
        fun parse(text: String): Project {
            require(text.length <= 100000) { "Проект больше 100 КБ" }
            val j = JSONObject(text)
            require(j.getString("format") == "bumbari-android" && j.getInt("version") == 1 && j.getString("units") == "cm") { "Неизвестный формат проекта" }
            fun n(k: String): Double { require(j.get(k) is Number) { "Ожидается число: $k" }; return j.getDouble(k) }
            return Project(j.getString("id"),Model.valueOf(j.getString("model")),j.getString("name"),j.getString("notes"),
                n("waist"),n("hip"),n("hipHeight"),n("length"),n("waistEase"),n("hipEase"),n("expansion"),n("seam"),n("hem"),n("belt"),n("zip"),j.getString("algorithm")).also { it.validate() }
        }
        fun decimal(text: String): Double = text.trim().replace(',','.').toDouble().also { require(it.isFinite()) }
    }
}