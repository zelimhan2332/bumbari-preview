package ru.bumbari.patterns

import android.graphics.*
import android.graphics.pdf.PdfDocument
import java.io.OutputStream
import kotlin.math.ceil
import kotlin.math.max

data class Tile(val row:Int,val col:Int,val x:Double,val y:Double)
object PdfLayout {
    const val PT_PER_MM=72.0/25.4
    fun tiles(width:Double,height:Double,a0:Boolean): List<Tile> {
        val w=if(a0)841.0 else 210.0;val h=if(a0)1189.0 else 297.0
        val dx=w-30;val dy=h-30
        val cols=max(1,ceil((width-10)/dx).toInt());val rows=max(1,ceil((height-10)/dy).toInt())
        return (0 until rows).flatMap { r -> (0 until cols).map { c -> Tile(r,c,c*dx,r*dy) } }
    }
}
object PatternPdf {
    fun write(pattern:Pattern,a0:Boolean,out:OutputStream) {
        val doc=PdfDocument();val pw=if(a0)841.0 else 210.0;val ph=if(a0)1189.0 else 297.0
        val black=Paint(Paint.ANTI_ALIAS_FLAG).apply { color=Color.BLACK;strokeWidth=.3f;style=Paint.Style.STROKE }
        val blue=Paint(black).apply { color=Color.rgb(50,85,130);pathEffect=DashPathEffect(floatArrayOf(2f,1f),0f) }
        val text=Paint(Paint.ANTI_ALIAS_FLAG).apply { color=Color.BLACK;textSize=3.2f;typeface=Typeface.create("sans-serif",Typeface.NORMAL) }
        var number=0
        try {
            pattern.pieces.forEachIndexed { index,piece ->
                val minX=piece.cut.minOf { it.x };val minY=piece.cut.minOf { it.y }
                val maxX=piece.cut.maxOf { it.x };val maxY=piece.cut.maxOf { it.y }
                val ox=12-minX*10;val oy=35-minY*10
                val width=max(180.0,(maxX-minX)*10+24);val height=(maxY-minY)*10+55
                PdfLayout.tiles(width,height,a0).forEach { tile ->
                    val page=doc.startPage(PdfDocument.PageInfo.Builder(ceil(pw*PdfLayout.PT_PER_MM).toInt(),ceil(ph*PdfLayout.PT_PER_MM).toInt(),++number).create())
                    val c=page.canvas;c.scale(PdfLayout.PT_PER_MM.toFloat(),PdfLayout.PT_PER_MM.toFloat())
                    c.drawText("Бумбари · ${index+1} · ряд ${tile.row+1}, лист ${tile.col+1} · 100% · нахлёст 10 мм",10f,6f,text)
                    c.save();c.clipRect(10f,10f,(pw-10).toFloat(),(ph-10).toFloat());c.translate((10-tile.x).toFloat(),(10-tile.y).toFloat())
                    fun chain(points:List<Point>,paint:Paint,close:Boolean) {
                        val path=Path();points.forEachIndexed { i,p -> val x=(ox+p.x*10).toFloat();val y=(oy+p.y*10).toFloat();if(i==0)path.moveTo(x,y)else path.lineTo(x,y) };if(close)path.close();c.drawPath(path,paint)
                    }
                    chain(piece.cut,black,true);chain(piece.seam,blue,true)
                    piece.marks.forEach { chain(it,blue,false) }
                    val beltIndex=if(pattern.project.model==Model.STRAIGHT) 2 else 1
                    val grain=when {
                        index==beltIndex -> listOf(Point(4.0,pattern.project.belt/2),Point(24.0,pattern.project.belt/2))
                        pattern.project.model==Model.GORES -> listOf(Point(0.0,6.0),Point(0.0,26.0.coerceAtMost(pattern.project.length-3)))
                        pattern.project.model==Model.STRAIGHT -> listOf(Point(3.0,8.0),Point(3.0,pattern.project.length-5))
                        else -> {
                            val r=pattern.waistLength/(if(pattern.project.model==Model.FULL)2*Math.PI else Math.PI)
                            val angle=if(pattern.project.model==Model.FULL)0.0 else Math.PI/4
                            listOf(Point((r+5)*kotlin.math.cos(angle),(r+5)*kotlin.math.sin(angle)),Point((r+15)*kotlin.math.cos(angle),(r+15)*kotlin.math.sin(angle)))
                        }
                    }
                    chain(grain,black,false)
                    val g=grain[0];val end=grain[1];val angle=kotlin.math.atan2(end.y-g.y,end.x-g.x)
                    for(side in listOf(-.45,.45)) chain(listOf(g,Point(g.x+kotlin.math.cos(angle+side),g.y+kotlin.math.sin(angle+side))),black,false)
                    c.drawText(piece.title,12f,12f,text);c.drawText("Количество: ${piece.count}. ${if(piece.fold)"На сгибе" else "Без сгиба"}. Припуски включены.",12f,18f,text)
                    c.drawText("Чёрный — срез; синий пунктир — шов и метки. Долевая отмечена стрелкой.",12f,24f,text)
                    c.restore();c.drawRect(10f,10f,(pw-10).toFloat(),(ph-10).toFloat(),black);doc.finishPage(page)
                }
            }
            val page=doc.startPage(PdfDocument.PageInfo.Builder(ceil(pw*PdfLayout.PT_PER_MM).toInt(),ceil(ph*PdfLayout.PT_PER_MM).toInt(),++number).create())
            val c=page.canvas;c.scale(PdfLayout.PT_PER_MM.toFloat(),PdfLayout.PT_PER_MM.toFloat())
            c.drawText("Бумбари · контроль 100 × 100 мм · печать 100%, без вписывания",15f,15f,text)
            c.drawRect(20f,25f,120f,125f,black)
            listOf("Модель: ${pattern.project.model.title}",
                "Талия по шву: ${pattern.waistLength} см. Пояс согласован.",
                "Обязательно: пробный макет и примерка. Посадка не проверена.",
                "Для круговых юбок: отвисание и выравнивание низа до обработки.",
                if(pattern.project.model==Model.STRAIGHT) "Основа: Ателье—2001, PDF 5–7; цифровые линии требуют пробника." else "Геометрическая модель; не буквальная формула книги.",
                "Молния ${pattern.project.zip} см. Пояс ${pattern.project.belt} см в готовом виде.")
                .forEachIndexed { i,s -> c.drawText(s,15f,145f+i*7,text) }
            doc.finishPage(page);doc.writeTo(out)
        } finally { doc.close() }
    }
}
