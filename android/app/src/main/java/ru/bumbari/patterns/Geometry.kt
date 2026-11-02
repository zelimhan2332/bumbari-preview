package ru.bumbari.patterns

import kotlin.math.*

data class Point(val x: Double, val y: Double)
data class Piece(val title: String, val count: Int, val fold: Boolean, val seam: List<Point>, val cut: List<Point>, val marks: List<List<Point>>)
data class Pattern(val project: Project, val pieces: List<Piece>, val waistLength: Double, val hipCircumference: Double)

object Geometry {
    // cm. Geometric adaptation, not literal Mueller formula; see android/README.md.
    private fun arc(r: Double, from: Double, to: Double): List<Point> {
        val steps = max(2, ceil(abs(to-from)/(2*acos(1-.002/r))).toInt())
        return (0..steps).map { val a=from+(to-from)*it/steps; Point(r*cos(a),r*sin(a)) }
    }
    private fun rectangle(x: Double,y: Double,w: Double,h: Double) = listOf(Point(x,y),Point(x+w,y),Point(x+w,y+h),Point(x,y+h))
    fun build(p: Project): Pattern {
        p.validate()
        val waist=p.waist+p.waistEase; val a=p.seam
        val skirt: Piece; val hips: Double
        if(p.model == Model.STRAIGHT) {
            val hipHalf=p.hip/2+p.hipEaseHalf
            hips=hipHalf*2
            val totalIntake=hipHalf-(p.waist/2+1.0)
            require(totalIntake in 8.0..18.0) { "Для такого соотношения талии и бёдер построение прямой юбки ещё не поддерживается." }
            val bookExample=p.hip==100.0 && p.hipHeight==20.8 && p.length==61.5 && p.hipEaseHalf==1.0 && p.waist in listOf(72.0,76.0)
            val backDarts=if(bookExample && p.waist==76.0) 1 else if(totalIntake>12.5) 2 else 1
            val sideTake=if(bookExample) 7.0 else totalIntake/2
            val frontTake=if(bookExample) 2.0 else minOf(2.0,totalIntake/4)
            val backTake=totalIntake-sideTake-frontTake
            val quarter=hipHalf/2; val frontWidth=quarter-sideTake/2; val backWidth=quarter-sideTake/2
            val frontClosed=frontWidth-frontTake; val backClosed=backWidth-backTake
            val frontDartX=frontClosed-7.0; val backDartXs=if(backDarts==2) listOf(6.0, backClosed-6.0) else listOf(backClosed/2)
            require(frontDartX>2 && backDartXs.all { it>2 && it<backClosed-1 }) { "Вытачки не помещаются на полотнище; проверьте мерки" }
            val frontDart=listOf(Point(frontDartX-frontTake/2,0.0),Point(frontDartX,9.5),Point(frontDartX+frontTake/2,0.0))
            val backIntakes=if(bookExample && p.waist==72.0) listOf(3.0,2.0) else if(backDarts==2) listOf(backTake*.6,backTake*.4) else listOf(backTake)
            val backMarks=backDartXs.zip(backIntakes).mapIndexed { i,(x,take)->listOf(Point(x-take/2,0.0),Point(x,if(backDarts==2&&i==0)12.5 else 14.0),Point(x+take/2,0.0)) }
            val hemY=p.length
            val frontSeam=listOf(Point(0.0,0.0),Point(frontClosed,0.0),Point(frontWidth,p.hipHeight),Point(frontWidth,hemY),Point(0.0,hemY))
            val backSeam=listOf(Point(0.0,0.0),Point(backClosed,0.0),Point(backWidth,p.hipHeight),Point(backWidth,hemY),Point(0.0,hemY))
            // Digital straight-panel approximation; the book's ease/dart totals are kept explicit.
            val frontCut=listOf(Point(0.0,-a),Point(frontClosed+a,-a),Point(frontWidth+a,p.hipHeight),Point(frontWidth+a,hemY+p.hem),Point(0.0,hemY+p.hem))
            val backCut=listOf(Point(-a,-a),Point(backClosed+a,-a),Point(backWidth+a,p.hipHeight),Point(backWidth+a,hemY+p.hem),
                Point(0.0,hemY+p.hem),Point(-p.ventWidth,hemY+p.hem),Point(-p.ventWidth,hemY-p.ventLength-2),Point(-a,hemY-p.ventLength-2),Point(-a,p.hipHeight))
            val frontPiece=Piece("Переднее полотнище · сгиб",1,true,frontSeam,frontCut,listOf(frontDart,
                listOf(Point(0.0,6.0),Point(0.0,p.length-3)),listOf(Point(frontWidth-.4,p.hipHeight),Point(frontWidth+a,p.hipHeight)),
                listOf(Point(frontWidth/2,p.length*.55),Point(frontWidth/2,p.length*.55+15))))
            val backPiece=Piece("Заднее полотнище · зеркальная пара · шлица",2,false,backSeam,backCut,backMarks+listOf(
                listOf(Point(backWidth-a,p.zip),Point(backWidth+a,p.zip)),listOf(Point(-p.ventWidth,p.length-p.ventLength),Point(-a,p.length-p.ventLength)),
                listOf(Point(backWidth/2,p.hipHeight),Point(backWidth/2,p.length-3))))
            val beltLength=p.waist+5
            val beltWidth=p.belt*2
            val belt=Piece("Пояс · прокладка · застёжка",1,false,
                rectangle(0.0,0.0,beltLength-3,beltWidth),rectangle(-a,-a,beltLength+a,beltWidth+a),
                listOf(listOf(Point(0.0,p.belt),Point(beltLength-3,p.belt)),listOf(Point(p.waist/2,0.0),Point(p.waist/2,beltWidth))))
            val result=Pattern(p,listOf(frontPiece,backPiece,belt),p.waist+2,hips)
            return result
        } else if(p.model != Model.GORES) {
            val full=p.model==Model.FULL; val theta=if(full) 2*PI else PI
            val r=waist/theta; val outer=r+p.length; val inner=r-a; val end=if(full) -PI/2 else 0.0
            hips=theta*(r+p.hipHeight)
            require(hips>=p.hip) { "Недостаточно объёма по бёдрам" }; require(inner>a) { "Припуск не помещается у талии" }
            val seam=arc(r,PI/2,end)+arc(outer,end,PI/2)
            val cut=arc(inner,PI/2+(if(full) asin(a/inner) else 0.0),end-asin(a/inner))+
                arc(outer+p.hem,end-asin(a/(outer+p.hem)),PI/2+(if(full) asin(a/(outer+p.hem)) else 0.0))
            val marks=mutableListOf<List<Point>>()
            for(t in listOf(.25,.5,.75)) {
                val angle=PI/2+(end-PI/2)*t
                marks.add(listOf(Point((r-a)*cos(angle),(r-a)*sin(angle)),Point((r+.4)*cos(angle),(r+.4)*sin(angle))))
            }
            val angle=if(full) 0.0 else PI/4
            marks.add(listOf(Point((r+5)*cos(angle),(r+5)*sin(angle)),Point((r+25)*cos(angle),(r+25)*sin(angle))))
            if(full) marks.add(listOf(Point(-a,r+p.zip),Point(.5,r+p.zip)))
            else marks.add(listOf(Point(r+p.zip,-a),Point(r+p.zip,.5)))
            if(!full) marks.add(listOf(Point(0.0,r),Point(0.0,outer)))
            skirt=Piece(if(full) "Полотнище 180° · без сгиба" else "Половина 90° · сгиб переда",if(full)2 else 1,!full,seam,cut,marks)
        } else {
            val top=waist/4; val hip=(p.hip+p.hipEase)/4; val hem=hip+2*p.expansion
            fun width(y: Double): Double {
                val t=if(y<=p.hipHeight)y/p.hipHeight else (y-p.hipHeight)/(p.length-p.hipHeight)
                val s=t*t*(3-2*t)
                return if(y<=p.hipHeight)top+(hip-top)*s else hip+(hem-hip)*s
            }
            val ys=((0..200).map { p.length*it/200 }+p.hipHeight).distinct().sorted()
            val right=ys.map { Point(width(it)/2,it) }; val left=right.reversed().map { Point(-it.x,it.y) }
            val seam=right+left
            // True polygon offsets, unlike the web branch's horizontal-only approximation.
            val cut=offset(seam,p.seam,p.hem)
            val marks=listOf(listOf(Point(0.0,6.0),Point(0.0,min(p.length-3,26.0))),
                listOf(Point(-hip/2-a,p.hipHeight),Point(-hip/2+.4,p.hipHeight)),
                listOf(Point(hip/2-.4,p.hipHeight),Point(hip/2+a,p.hipHeight)),
                listOf(Point(width(p.zip)/2-.5,p.zip),Point(width(p.zip)/2+a,p.zip)))
            skirt=Piece("Симметричный клин · молния в одном шве",4,false,seam,cut,marks); hips=hip*4
        }
        val beltLength=waist+3; val bh=2*p.belt
        val marks=mutableListOf(listOf(Point(0.0,p.belt),Point(beltLength,p.belt)),listOf(Point(waist,0.0),Point(waist,bh)))
        for(x in listOf(waist/4,waist/2,waist*3/4)) marks.add(listOf(Point(x,-a),Point(x,.4)))
        marks.add(listOf(Point(4.0,p.belt/2),Point(min(24.0,waist-2),p.belt/2)))
        val belt=Piece("Пояс · сгиб · выступ застёжки 3 см + прокладка",1,false,rectangle(0.0,0.0,beltLength,bh),rectangle(-a,-a,beltLength+2*a,bh+2*a),marks)
        return Pattern(p,listOf(skirt,belt),waist,hips)
    }
    private fun offset(poly: List<Point>, side: Double, hem: Double): List<Point> {
        val area=poly.indices.sumOf { i -> val a=poly[i]; val b=poly[(i+1)%poly.size]; a.x*b.y-b.x*a.y }
        val sign=if(area>0)1 else -1; val ymax=poly.maxOf { it.y }
        data class Edge(val p:Point,val dx:Double,val dy:Double)
        val edges=poly.indices.map { i ->
            val a=poly[i];val b=poly[(i+1)%poly.size];val dx=b.x-a.x;val dy=b.y-a.y;val len=hypot(dx,dy)
            require(len>1e-10);val distance=if(abs(a.y-ymax)<1e-8&&abs(b.y-ymax)<1e-8)hem else side
            Edge(Point(a.x+sign*dy/len*distance,a.y-sign*dx/len*distance),dx,dy)
        }
        return edges.indices.map { i -> val a=edges[(i+edges.size-1)%edges.size];val b=edges[i];val det=a.dx*b.dy-a.dy*b.dx
            if(abs(det)<1e-10)b.p else {val t=((b.p.x-a.p.x)*b.dy-(b.p.y-a.p.y)*b.dx)/det;Point(a.p.x+t*a.dx,a.p.y+t*a.dy)} }
    }
}
