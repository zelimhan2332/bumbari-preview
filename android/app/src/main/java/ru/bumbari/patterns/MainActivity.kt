package ru.bumbari.patterns

import android.os.Bundle
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.FileProvider
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.io.File
import java.util.concurrent.Executors

private val Ink = Color(0xff203238)
private val Muted = Color(0xff64767a)
private val CanvasBg = Color(0xfff4f7f3)
private val Leaf = Color(0xff39756c)
private val LeafSoft = Color(0xffe2efeb)
private val Gold = Color(0xffc68a45)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme(colorScheme = lightColorScheme(
                primary = Leaf,
                onPrimary = Color.White,
                secondary = Gold,
                background = CanvasBg,
                surface = Color.White,
                onSurface = Ink,
                onBackground = Ink,
                error = Color(0xffb33b32)
            )) { App() }
        }
    }

    @Composable
    private fun App() {
        var model by remember { mutableStateOf<Model?>(null) }
        var step by remember { mutableIntStateOf(0) }
        var id by remember { mutableStateOf(java.util.UUID.randomUUID().toString()) }
        var name by remember { mutableStateOf("") }
        var notes by remember { mutableStateOf("") }
        val values = remember { mutableStateMapOf<String, String>() }
        var message by remember { mutableStateOf("") }
        var messageIsError by remember { mutableStateOf(false) }
        var pattern by remember { mutableStateOf<Pattern?>(null) }
        var consent by remember { mutableStateOf(false) }
        var a0 by remember { mutableStateOf(false) }
        var saved by remember { mutableStateOf(emptyList<Project>()) }
        var updateStatus by remember { mutableStateOf("") }
        var updateError by remember { mutableStateOf(false) }
        var updateBusy by remember { mutableStateOf(false) }
        var updateFile by remember { mutableStateOf<File?>(null) }
        val updateExecutor = remember { Executors.newSingleThreadExecutor() }
        DisposableEffect(Unit) { onDispose { updateExecutor.shutdownNow() } }
        val dir = File(filesDir, "projects").also { it.mkdirs() }

        fun refreshSaved() {
            saved = dir.listFiles()?.filter { it.extension == "json" }
                ?.sortedByDescending { it.lastModified() }
                ?.mapNotNull { runCatching { Project.parse(it.readText()) }.getOrNull() } ?: emptyList()
        }
        fun load(project: Project) {
            model = project.model
            id = project.id
            name = project.name
            notes = project.notes
            values.clear()
            project.numbers().forEach { (key, value) -> values[key] = value.toString() }
            pattern = null
            consent = false
            message = ""
            step = 1
        }
        fun currentProject(): Project {
            fun number(key: String) = Project.decimal(values[key] ?: "")
            return Project(
                id = id,
                model = requireNotNull(model),
                name = name,
                notes = notes,
                waist = number("waist"),
                hip = number("hip"),
                hipHeight = number("hipHeight"),
                length = number("length"),
                waistEase = number("waistEase"),
                hipEase = number("hipEase"),
                expansion = number("expansion"),
                seam = number("seam"),
                hem = number("hem"),
                belt = number("belt"),
                zip = number("zip"),
                hipEaseHalf = number("hipEaseHalf"),
                ventLength = number("ventLength"),
                ventWidth = number("ventWidth")
            ).also { it.validate() }
        }
        fun protect(action: () -> Unit) {
            runCatching(action).onSuccess { messageIsError = false }.onFailure {
                message = it.message ?: "Не удалось выполнить действие"
                messageIsError = true
            }
        }
        fun saveLocally() = protect {
            val project = currentProject()
            Geometry.build(project)
            val target = File(dir, "${project.id}.json")
            val temp = File(dir, "${project.id}.tmp")
            temp.writeText(project.json())
            require(temp.renameTo(target)) { "Не удалось сохранить проект" }
            refreshSaved()
            message = "Проект сохранён на устройстве"
        }
        fun checkForUpdates() {
            if (updateBusy) return
            updateBusy = true; updateError = false; updateFile = null; updateStatus = "Проверяю наличие обновлений…"
            updateExecutor.execute {
                try {
                    val packageInfo = packageManager.getPackageInfo(packageName, 0)
                    @Suppress("DEPRECATION") val currentCode = if (android.os.Build.VERSION.SDK_INT >= 28) packageInfo.longVersionCode else packageInfo.versionCode.toLong()
                    val update = AppUpdateClient.currentUpdate(currentCode, packageName)
                    if (update == null) runOnUiThread {
                        updateBusy = false; updateError = false; updateStatus = "Установлена последняя доступная версия."
                    } else {
                        val file = AppUpdateClient.download(update, cacheDir)
                        runOnUiThread {
                            updateBusy = false; updateFile = file; updateError = false
                            updateStatus = "Доступна версия ${update.versionName}. Файл проверен. Нажмите, чтобы установить."
                        }
                    }
                } catch (_: Exception) {
                    runOnUiThread {
                        updateBusy = false; updateError = true
                        updateStatus = "Не удалось проверить обновление. Проверьте интернет и наличие выпуска в GitHub."
                    }
                }
            }
        }
        fun installDownloadedUpdate() {
            val file = updateFile ?: return
            try {
                if (!packageManager.canRequestPackageInstalls()) {
                    updateStatus = "Разрешите установку приложений из Bumbari в системных настройках, затем нажмите ещё раз."
                    updateError = false
                    startActivity(Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:$packageName")))
                    return
                }
                val uri = FileProvider.getUriForFile(this@MainActivity, "$packageName.fileprovider", file)
                startActivity(Intent(Intent.ACTION_VIEW).setDataAndType(uri, "application/vnd.android.package-archive")
                    .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION))
            } catch (_: Exception) {
                updateStatus = "Не удалось открыть установщик Android. Проверьте разрешение на установку."
                updateError = true
            }
        }

        LaunchedEffect(Unit) { refreshSaved() }
        val importer = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
            if (uri != null) protect {
                val text = contentResolver.openInputStream(uri)!!.use { stream ->
                    val buffer = java.io.ByteArrayOutputStream()
                    val chunk = ByteArray(4096)
                    var read = stream.read(chunk)
                    while (read >= 0) {
                        buffer.write(chunk, 0, read)
                        require(buffer.size() <= 100000) { "Файл слишком большой" }
                        read = stream.read(chunk)
                    }
                    buffer.toString("UTF-8")
                }
                val project = Project.parse(text)
                Geometry.build(project)
                load(project)
                message = "Проект открыт"
            }
        }
        var pendingJson by remember { mutableStateOf("") }
        var pendingPdf by remember { mutableStateOf<Pattern?>(null) }
        var pdfA0 by remember { mutableStateOf(false) }
        val exporter = rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("application/json")) { uri ->
            if (uri != null) protect {
                contentResolver.openOutputStream(uri)!!.use { it.write(pendingJson.toByteArray()) }
                message = "Файл проекта сохранён"
            }
        }
        val pdf = rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("application/pdf")) { uri ->
            if (uri != null) protect {
                contentResolver.openOutputStream(uri)!!.use { PatternPdf.write(requireNotNull(pendingPdf), pdfA0, it) }
                message = "PDF сохранён. Для печати выберите масштаб 100%."
            }
        }

        Surface(color = CanvasBg, modifier = Modifier.fillMaxSize()) {
            Column(
                Modifier.windowInsetsPadding(WindowInsets.safeDrawing)
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 18.dp, vertical = 14.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                BrandHeader()
                if (message.isNotBlank()) StatusNote(message, messageIsError)

                if (step == 0) {
                    Text("Выберите модель юбки", style = MaterialTheme.typography.headlineSmall, color = Ink, fontWeight = FontWeight.Bold)
                    Text("Сначала внесите мерки — приложение построит чертёж и подготовит файлы проекта.", style = MaterialTheme.typography.bodyMedium, color = Muted)
                    Model.entries.toList().chunked(2).forEach { row ->
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            row.forEach { item -> ModelCard(item, Modifier.weight(1f)) {
                            model = item
                            id = java.util.UUID.randomUUID().toString()
                            name = ""
                            notes = ""
                            pattern = null
                            consent = false
                            message = ""
                            values.clear()
                            listOf("waist", "hip", "hipHeight", "length").forEach { values[it] = "" }
                            mapOf("waistEase" to "1", "hipEase" to "2", "expansion" to "3", "seam" to if (item == Model.STRAIGHT) "2" else "1", "hem" to if (item == Model.STRAIGHT) "4" else "1", "belt" to "3", "zip" to "20", "hipEaseHalf" to "1", "ventLength" to "16", "ventWidth" to "5")
                                .forEach { (key, value) -> values[key] = value }
                            step = 1
                            } }
                            if(row.size==1) Spacer(Modifier.weight(1f))
                        }
                    }
                    if (updateStatus.isNotBlank()) StatusNote(updateStatus, updateError)
                    OutlinedButton(
                        enabled = !updateBusy,
                        onClick = { if (updateFile == null) checkForUpdates() else installDownloadedUpdate() },
                        modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp)
                    ) {
                        Text(if (updateBusy) "Проверяю обновления…" else if (updateFile != null) "Установить обновление" else "Проверить обновления")
                    }
                    OutlinedButton(
                        onClick = { importer.launch(arrayOf("application/json", "text/plain", "application/octet-stream")) },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp)
                    ) { Text("Открыть файл проекта") }
                    if (saved.isNotEmpty()) {
                        Text("Недавние проекты", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                        saved.forEach { project ->
                            OutlinedButton(onClick = { load(project) }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp)) {
                                Text("${project.name.ifBlank { "Без названия" }} · ${project.model.title}")
                            }
                        }
                    } else {
                        Text("Сохранённые проекты появятся здесь.", style = MaterialTheme.typography.bodySmall, color = Muted)
                    }
                    Text("Перед раскроем сделайте пробный макет и проверьте посадку.", style = MaterialTheme.typography.bodySmall, color = Muted)
                } else {
                    WizardHeader(step)
                    Text(requireNotNull(model).title, style = MaterialTheme.typography.titleLarge, color = Ink, fontWeight = FontWeight.Bold)
                    if (step == 1) {
                        SectionCard(title = "Название и мерки", subtitle = "Значения вводятся в сантиметрах. Личные мерки не подставляются.") {
                            OutlinedTextField(
                                value = name,
                                onValueChange = { name = it },
                                label = { Text("Название проекта") },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(14.dp)
                            )
                            val labels = linkedMapOf(
                                "waist" to "Обхват талии",
                                "hip" to "Обхват бёдер",
                                "hipHeight" to "Высота бёдер",
                                "length" to "Длина юбки"
                            )
                            if (model != Model.STRAIGHT) labels["waistEase"] = "Прибавка к талии"
                            if (model == Model.GORES) {
                                labels["hipEase"] = "Прибавка к бёдрам"
                                labels["expansion"] = "Расширение клина на сторону"
                            }
                            if (model == Model.STRAIGHT) labels["hipEaseHalf"] = "Прибавка к бёдрам на половину изделия (1 или 2)"
                            val hints = mutableMapOf(
                                "waist" to "По естественной линии талии, без натяжения ленты.",
                                "hip" to "По наиболее выступающим точкам бёдер.",
                                "hipHeight" to "От талии до уровня измерения бёдер.",
                                "length" to "От талии до выбранной длины юбки."
                            )
                            if (model != Model.STRAIGHT) hints["waistEase"] = "Прибавка к мерке для свободы движения."
                            if (model == Model.GORES) {
                                hints["hipEase"] = "Добавляется к обхвату бёдер для свободы."
                                hints["expansion"] = "Прибавка модели на одну сторону клина."
                            }
                            if (model == Model.STRAIGHT) hints["hipEaseHalf"] = "В контрольных примерах Ателье—2001 показано 1 см на половину изделия."
                            labels.forEach { (key, label) ->
                                OutlinedTextField(
                                    value = values[key] ?: "",
                                    onValueChange = { values[key] = it; pattern = null; consent = false },
                                    label = { Text("$label, см") },
                                    supportingText = { hints[key]?.let { hint -> Text(hint) } },
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                                    modifier = Modifier.fillMaxWidth(),
                                    singleLine = true,
                                    shape = RoundedCornerShape(14.dp)
                                )
                            }
                            Text("Допустимы десятичная запятая и точка.", style = MaterialTheme.typography.bodySmall, color = Muted)
                        }
                        SectionCard(title = "Обработка", subtitle = "Настройки можно изменить перед построением.") {
                            val finishing = linkedMapOf(
                                "seam" to "Припуск шва",
                                "hem" to "Подгибка низа",
                                "belt" to "Ширина пояса в готовом виде",
                                "zip" to "Длина молнии"
                            )
                            if (model == Model.STRAIGHT) {
                                finishing["ventLength"] = "Длина шлицы сзади"
                                finishing["ventWidth"] = "Ширина шлицы сзади"
                            }
                            finishing.forEach { (key, label) ->
                                OutlinedTextField(
                                    value = values[key] ?: "",
                                    onValueChange = { values[key] = it; pattern = null; consent = false },
                                    label = { Text("$label, см") },
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                                    modifier = Modifier.fillMaxWidth(),
                                    singleLine = true,
                                    shape = RoundedCornerShape(14.dp)
                                )
                            }
                        }
                        SectionCard(title = "Заметки", subtitle = "Например: ткань, пробный макет, особенности посадки.") {
                            OutlinedTextField(
                                value = notes,
                                onValueChange = { notes = it },
                                label = { Text("Заметки к проекту") },
                                modifier = Modifier.fillMaxWidth(),
                                minLines = 2,
                                shape = RoundedCornerShape(14.dp)
                            )
                        }
                        Button(onClick = {
                            protect { pattern = Geometry.build(currentProject()); step = 2; message = "" }
                        }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp)) {
                            Text("Построить чертёж")
                        }
                    } else {
                        pattern?.let { currentPattern ->
                            SectionCard(title = "Результат расчёта", subtitle = "Это геометрическая модель. Посадка проверяется на макете.") {
                                Text("Длина талиевого шва: ${"%.2f".format(currentPattern.waistLength)} см", fontWeight = FontWeight.SemiBold, color = Ink)
                                Text("Обхват по линии бёдер: ${"%.2f".format(currentPattern.hipCircumference)} см", color = Muted)
                            }
                            currentPattern.pieces.forEach { piece ->
                                SectionCard(
                                    title = piece.title,
                                    subtitle = "${piece.count} шт. · ${if (piece.fold) "на сгибе" else "без сгиба"} · припуски включены"
                                ) {
                                    PatternPreview(piece, Modifier.fillMaxWidth().height(250.dp))
                                    LegendLine(Color(0xff263b3b), "Тёмная линия — срез")
                                    LegendLine(Leaf, "Зелёная линия — шов")
                                    LegendLine(Gold, "Золотые метки — контрольные знаки")
                                }
                            }
                            SectionCard(title = "Подготовка PDF", subtitle = "Проверьте макет перед раскроем.") {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Checkbox(checked = consent, onCheckedChange = { consent = it })
                                    Text("Понимаю: цифровой расчёт не проверяет посадку.", style = MaterialTheme.typography.bodyMedium)
                                }
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Checkbox(checked = a0, onCheckedChange = { a0 = it })
                                    Text("Формат A0 для плоттера (иначе A4 плитками)", style = MaterialTheme.typography.bodyMedium)
                                }
                                Text("Печатать 100%, отключить «вписать в страницу». В PDF есть контрольный квадрат 100 × 100 мм.", style = MaterialTheme.typography.bodySmall, color = Muted)
                                Button(
                                    enabled = consent,
                                onClick = { pendingPdf = currentPattern; pdfA0 = a0; pdf.launch("Бумбари-${currentPattern.project.model.name}.pdf") },
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(16.dp)
                                ) { Text("Сохранить PDF 1:1") }
                            }
                        }
                        OutlinedButton(onClick = { step = 1; consent = false }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp)) {
                            Text("Изменить мерки")
                        }
                    }

                    OutlinedButton(onClick = { saveLocally() }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp)) {
                        Text("Сохранить проект на устройстве")
                    }
                    OutlinedButton(onClick = { protect { pendingJson = currentProject().json(); exporter.launch("Проект-Бумбари.json") } }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp)) {
                        Text("Экспорт файла проекта")
                    }
                    TextButton(onClick = { step = 0; model = null; pattern = null; consent = false; message = "" }, modifier = Modifier.fillMaxWidth()) {
                        Text("Вернуться к моделям")
                    }
                }
                Spacer(Modifier.height(8.dp))
            }
        }
    }
}

@Composable
private fun BrandHeader() {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        Box(Modifier.size(48.dp).clip(RoundedCornerShape(16.dp)).background(Leaf), contentAlignment = Alignment.Center) {
            Text("Б", color = Color.White, fontSize = 26.sp, fontWeight = FontWeight.Bold)
        }
        Column {
            Text("Bumbari", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = Ink)
            Text("Мастерская выкроек", style = MaterialTheme.typography.bodySmall, color = Muted)
        }
    }
}

@Composable
private fun ModelCard(model: Model, modifier: Modifier = Modifier, onClick: () -> Unit) {
    val descriptions = when (model) {
        Model.HALF -> "Сектор на сгибе"
        Model.FULL -> "Два полотнища по 180°"
        Model.GORES -> "Четыре симметричных клина"
        Model.STRAIGHT -> "Перед, спинка и пояс"
    }
    Card(onClick = onClick, modifier=modifier.heightIn(min=150.dp), shape = RoundedCornerShape(20.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
        Column(Modifier.fillMaxWidth().padding(horizontal=10.dp, vertical=10.dp), horizontalAlignment=Alignment.CenterHorizontally, verticalArrangement=Arrangement.spacedBy(5.dp)) {
            Box(Modifier.size(68.dp).clip(RoundedCornerShape(16.dp)).background(LeafSoft), contentAlignment = Alignment.Center) {
                ModelGlyph(model, Modifier.size(58.dp))
            }
            Text(model.title.substringBefore(" ·"), style = MaterialTheme.typography.titleSmall, color = Ink, fontWeight = FontWeight.SemiBold, maxLines=1)
            Text(descriptions, style = MaterialTheme.typography.bodySmall, color = Muted, maxLines=2, minLines=2)
        }
    }
}

@Composable
private fun ModelGlyph(model: Model, modifier: Modifier = Modifier) {
    Canvas(modifier) {
        val stroke = Stroke(width = size.minDimension * .055f, cap = StrokeCap.Round)
        val c = Color(0xff39756c)
        // Small garment flats, so each card reads as a skirt model rather than a generic shape.
        val top = size.height * .22f
        val hem = size.height * .86f
        val center = size.width * .5f
        val waistHalf = when (model) {
            Model.HALF -> size.width*.22f
            Model.FULL -> size.width*.12f
            Model.GORES -> size.width*.19f
            Model.STRAIGHT -> size.width*.25f
        }
        val hemHalf = when (model) {
            Model.HALF -> size.width*.36f
            Model.FULL -> size.width*.49f
            Model.GORES -> size.width*.39f
            Model.STRAIGHT -> size.width*.34f
        }
        val skirt = Path().apply {
            moveTo(center-waistHalf,top); lineTo(center+waistHalf,top)
            lineTo(center+hemHalf,hem); lineTo(center-hemHalf,hem); close()
        }
        drawPath(skirt,c,style=stroke)
        drawLine(c,Offset(center-waistHalf,top+size.height*.075f),Offset(center+waistHalf,top+size.height*.075f),strokeWidth=stroke.width)
        when(model) {
            Model.HALF,Model.FULL -> {
                drawLine(c,Offset(center-waistHalf*.55f,top+size.height*.08f),Offset(center-hemHalf*.42f,hem-size.height*.08f),strokeWidth=stroke.width*.65f)
                drawLine(c,Offset(center+waistHalf*.55f,top+size.height*.08f),Offset(center+hemHalf*.42f,hem-size.height*.08f),strokeWidth=stroke.width*.65f)
            }
            Model.GORES -> {
                for(fraction in listOf(-.5f,0f,.5f)) {
                    val xTop=center+waistHalf*fraction; val xHem=center+hemHalf*fraction
                    drawLine(c,Offset(xTop,top+size.height*.08f),Offset(xHem,hem-size.height*.08f),strokeWidth=stroke.width*.7f)
                }
            }
            Model.STRAIGHT -> {
                for(fraction in listOf(-.46f,.46f)) {
                    val x=center+waistHalf*fraction
                    drawLine(c,Offset(x,top+size.height*.08f),Offset(x,hem-size.height*.08f),strokeWidth=stroke.width*.72f)
                }
                for(fraction in listOf(-.23f,.23f)) {
                    val x=center+waistHalf*fraction
                    drawLine(c,Offset(x,top+size.height*.08f),Offset(x,top+size.height*.24f),strokeWidth=stroke.width*.7f)
                }
                drawLine(c,Offset(center,hem-size.height*.14f),Offset(center,hem-size.height*.035f),strokeWidth=stroke.width)
            }
        }
    }
}

@Composable
private fun WizardHeader(step: Int) {
    val labels = listOf("1 · Мерки", "2 · Чертёж и файлы")
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            labels.forEachIndexed { index, label ->
                Text(label, style = MaterialTheme.typography.labelLarge, color = if (step >= index + 1) Leaf else Muted, fontWeight = if (step == index + 1) FontWeight.Bold else FontWeight.Normal)
            }
        }
        LinearProgressIndicator(progress = { if (step == 1) .5f else 1f }, modifier = Modifier.fillMaxWidth().height(6.dp).clip(CircleShape), color = Leaf, trackColor = LeafSoft)
    }
}

@Composable
private fun SectionCard(title: String, subtitle: String, content: @Composable ColumnScope.() -> Unit) {
    Card(shape = RoundedCornerShape(22.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
        Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(title, style = MaterialTheme.typography.titleMedium, color = Ink, fontWeight = FontWeight.SemiBold)
                Text(subtitle, style = MaterialTheme.typography.bodySmall, color = Muted)
            }
            content()
        }
    }
}

@Composable
private fun StatusNote(message: String, isError: Boolean) {
    val color = if (isError) MaterialTheme.colorScheme.error else Leaf
    Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = if (isError) Color(0xffffeeeb) else LeafSoft)) {
        Text(message, Modifier.fillMaxWidth().padding(14.dp), style = MaterialTheme.typography.bodyMedium, color = color)
    }
}

@Composable
private fun LegendLine(color: Color, label: String) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(9.dp)) {
        Box(Modifier.size(width = 22.dp, height = 3.dp).clip(CircleShape).background(color))
        Text(label, style = MaterialTheme.typography.bodySmall, color = Muted)
    }
}

@Composable
private fun PatternPreview(piece: Piece, modifier: Modifier = Modifier) {
    Canvas(modifier) {
        val minX = piece.cut.minOf { it.x }
        val minY = piece.cut.minOf { it.y }
        val width = (piece.cut.maxOf { it.x } - minX).coerceAtLeast(.1)
        val height = (piece.cut.maxOf { it.y } - minY).coerceAtLeast(.1)
        val scale = minOf((size.width - 28f) / width.toFloat(), (size.height - 28f) / height.toFloat())
        val drawnWidth = width.toFloat() * scale
        val drawnHeight = height.toFloat() * scale
        val offsetX = (size.width - drawnWidth) / 2f
        val offsetY = (size.height - drawnHeight) / 2f
        fun path(points: List<Point>, close: Boolean) = Path().apply {
            points.forEachIndexed { index, point ->
                val x = offsetX + (point.x - minX).toFloat() * scale
                val y = offsetY + (point.y - minY).toFloat() * scale
                if (index == 0) moveTo(x, y) else lineTo(x, y)
            }
            if (close) close()
        }
        drawRoundRect(Color(0xfff6f8f5), cornerRadius = androidx.compose.ui.geometry.CornerRadius(18f, 18f))
        drawPath(path(piece.cut, true), Color(0xff263b3b), style = Stroke(3f))
        drawPath(path(piece.seam, true), Leaf, style = Stroke(2f))
        piece.marks.forEach { drawPath(path(it, false), Gold, style = Stroke(2f)) }
    }
}
