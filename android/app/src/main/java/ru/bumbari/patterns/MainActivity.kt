package ru.bumbari.patterns

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import java.io.File

class MainActivity:ComponentActivity() {
    override fun onCreate(savedInstanceState:Bundle?) { super.onCreate(savedInstanceState);setContent { MaterialTheme { App() } } }
    @Composable private fun App() {
        var model by remember { mutableStateOf<Model?>(null) };var step by remember { mutableIntStateOf(0) }
        var id by remember { mutableStateOf(java.util.UUID.randomUUID().toString()) }
        var name by remember { mutableStateOf("") };var notes by remember { mutableStateOf("") }
        val values=remember { mutableStateMapOf<String,String>() };var message by remember { mutableStateOf("") }
        var pattern by remember { mutableStateOf<Pattern?>(null) };var consent by remember { mutableStateOf(false) };var a0 by remember { mutableStateOf(false) }
        var saved by remember { mutableStateOf(emptyList<Project>()) }
        val dir=File(filesDir,"projects").also { it.mkdirs() }
        fun refreshSaved() { saved=dir.listFiles()?.filter { it.extension=="json" }?.mapNotNull { runCatching { Project.parse(it.readText()) }.getOrNull() }?:emptyList() }
        fun load(p:Project) { model=p.model;id=p.id;name=p.name;notes=p.notes;values.clear();p.numbers().forEach { (k,v)->values[k]=v.toString() };pattern=null;consent=false;step=1 }
        fun project():Project {
            fun n(k:String)=Project.decimal(values[k]?:"")
            return Project(id,requireNotNull(model),name,notes,n("waist"),n("hip"),n("hipHeight"),n("length"),n("waistEase"),n("hipEase"),n("expansion"),n("seam"),n("hem"),n("belt"),n("zip")).also { it.validate() }
        }
        fun protect(action:()->Unit) { runCatching(action).onFailure { message=it.message?:"Не удалось выполнить действие" } }
        LaunchedEffect(Unit) { refreshSaved() }
        val importer=rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri -> if(uri!=null)protect {
            val text=contentResolver.openInputStream(uri)!!.use { stream -> val buffer=java.io.ByteArrayOutputStream();val chunk=ByteArray(4096);var n=stream.read(chunk);while(n>=0){buffer.write(chunk,0,n);require(buffer.size()<=100000){"Файл слишком большой"};n=stream.read(chunk)};buffer.toString("UTF-8") }
            val p=Project.parse(text);Geometry.build(p);load(p);message="Проект открыт"
        } }
        var pendingJson by remember { mutableStateOf("") };var pendingPdf by remember { mutableStateOf<Pattern?>(null) };var pdfA0 by remember { mutableStateOf(false) }
        val exporter=rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("application/json")) { uri -> if(uri!=null)protect { contentResolver.openOutputStream(uri)!!.use { it.write(pendingJson.toByteArray()) };message="Проект экспортирован" } }
        val pdf=rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("application/pdf")) { uri -> if(uri!=null)protect { contentResolver.openOutputStream(uri)!!.use { PatternPdf.write(requireNotNull(pendingPdf),pdfA0,it) };message="Векторный PDF сохранён. Печатать 100%." } }
        Surface(color=Color(0xffe3f0ff),modifier=Modifier.fillMaxSize()) {
            Column(Modifier.windowInsetsPadding(WindowInsets.safeDrawing).padding(16.dp).verticalScroll(rememberScrollState()),verticalArrangement=Arrangement.spacedBy(10.dp)) {
                Text("Bumbari",style=MaterialTheme.typography.headlineLarge)
                Text("Учебный прототип · локально · без облака")
                Text("Пробный макет и примерка обязательны. Цифровые проверки не подтверждают посадку.")
                if(message.isNotEmpty()) Text(message,color=MaterialTheme.colorScheme.error)
                if(step==0) {
                    Text("Поясные изделия · юбки",style=MaterialTheme.typography.titleLarge)
                    Model.entries.forEach { m -> Button(onClick={
                        model=m;id=java.util.UUID.randomUUID().toString();name="";notes="";pattern=null;consent=false
                        values.clear();listOf("waist","hip","hipHeight","length").forEach { values[it]="" }
                        mapOf("waistEase" to "1","hipEase" to "2","expansion" to "3","seam" to "1","hem" to "1","belt" to "3","zip" to "20").forEach { (k,v)->values[k]=v };step=1
                    },modifier=Modifier.fillMaxWidth()) { Text(m.title) } }
                    Text("Остальные категории не реализованы в Android MVP.")
                    OutlinedButton(onClick={importer.launch(arrayOf("application/json","text/plain","application/octet-stream"))}) { Text("Импорт проекта") }
                    Text("Сохранённые проекты",style=MaterialTheme.typography.titleMedium)
                    saved.forEach { p -> OutlinedButton(onClick={load(p)}) { Text("${p.name.ifBlank { "Без названия" }} · ${p.model.title}") } }
                } else {
                    Text(requireNotNull(model).title,style=MaterialTheme.typography.titleLarge)
                    Text("Мерки → проверка и чертёж → проект и PDF")
                    if(step==1) {
                        OutlinedTextField(name,{name=it},label={Text("Название проекта")},modifier=Modifier.fillMaxWidth())
                        val labels=linkedMapOf("waist" to "Обхват талии · по линии талии","hip" to "Обхват бёдер · по выступающим точкам","hipHeight" to "Высота бёдер · от талии вниз","length" to "Длина юбки · от талии до низа","waistEase" to "Прибавка к полному обхвату талии")
                        if(model==Model.GORES) { labels["hipEase"]="Прибавка к полному обхвату бёдер";labels["expansion"]="Расширение клина на каждую сторону" }
                        labels.putAll(mapOf("seam" to "Припуск шва","hem" to "Припуск подгибки низа","belt" to "Ширина пояса в готовом виде","zip" to "Длина молнии"))
                        labels.forEach { (k,label)->OutlinedTextField(values[k]?:"",{values[k]=it;pattern=null;consent=false},label={Text("$label, см")},keyboardOptions=KeyboardOptions(keyboardType=KeyboardType.Decimal),modifier=Modifier.fillMaxWidth(),singleLine=true) }
                        Text("Мерки — с фигуры; прибавки — свобода; расширение — модель; припуски — обработка. Допустимы запятая и точка. Значения мерок не подставляются автоматически.")
                        OutlinedTextField(notes,{notes=it},label={Text("Заметки")},modifier=Modifier.fillMaxWidth())
                        Button(onClick={protect { pattern=Geometry.build(project());step=2;message="" }}) { Text("Построить и проверить") }
                    } else {
                        pattern?.let { pat ->
                            Text("Талия по шву ${"%.2f".format(pat.waistLength)} см · бёдра ${"%.2f".format(pat.hipCircumference)} см")
                            pat.pieces.forEach { piece ->
                                Text("${piece.title} · ${piece.count} шт.")
                                Canvas(Modifier.fillMaxWidth().height(300.dp)) {
                                    val minX=piece.cut.minOf { it.x };val minY=piece.cut.minOf { it.y };val w=piece.cut.maxOf { it.x }-minX;val h=piece.cut.maxOf { it.y }-minY
                                    val scale=minOf((size.width-20)/w.toFloat(),(size.height-20)/h.toFloat())
                                    fun path(points:List<Point>,close:Boolean):Path=Path().apply { points.forEachIndexed { i,p -> val x=10+(p.x-minX).toFloat()*scale;val y=10+(p.y-minY).toFloat()*scale;if(i==0)moveTo(x,y)else lineTo(x,y) };if(close)close() }
                                    drawPath(path(piece.cut,true),Color.Black,style=Stroke(2f));drawPath(path(piece.seam,true),Color(0xff315d94),style=Stroke(1f));piece.marks.forEach { drawPath(path(it,false),Color(0xff315d94),style=Stroke(1f)) }
                                }
                            }
                            Row { Checkbox(consent,{consent=it});Text("Понимаю: геометрическая модель; нужен макет. Посадка не проверена.") }
                            Row { Checkbox(a0,{a0=it});Text("A0 для плоттера (иначе A4), нахлёст 10 мм") }
                            Button(enabled=consent,onClick={protect { pendingPdf=pat;pdfA0=a0;pdf.launch("Bumbari-${pat.project.model.name}.pdf") }}) { Text("Сохранить векторный PDF 1:1") }
                        }
                        OutlinedButton(onClick={step=1;consent=false}) { Text("Изменить мерки") }
                    }
                    Button(onClick={protect { val p=project();Geometry.build(p);val target=File(dir,"${p.id}.json");val temp=File(dir,"${p.id}.tmp");temp.writeText(p.json());require(temp.renameTo(target)){"Не удалось сохранить проект"};refreshSaved();message="Сохранено на устройстве" }}) { Text("Сохранить проект локально") }
                    OutlinedButton(onClick={protect { pendingJson=project().json();exporter.launch("Bumbari-project.json") }}) { Text("Экспорт файла проекта") }
                    OutlinedButton(onClick={step=0;model=null;pattern=null;message=""}) { Text("В каталог · несохранённые изменения не сохраняются") }
                }
            }
        }
    }
}