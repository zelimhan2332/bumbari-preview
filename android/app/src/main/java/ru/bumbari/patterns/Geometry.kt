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
        if(p.model != Model.GORES) {
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