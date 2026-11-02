package ru.bumbari.patterns

import org.junit.Assert.*
import org.junit.Test
import kotlin.math.*

class PatternTest {
    private fun example(m:Model)=Project(model=m,name="Демонстрационный пример",waist=72.0,hip=100.0,hipHeight=20.8,length=61.5)
    @Test fun projectsAreLosslessAndIndependent() {
        Model.entries.forEach { m -> val p=example(m).copy(notes="Пробный макет\nПроверить баланс",expansion=4.0);assertEquals(p,Project.parse(p.json())) }
        assertEquals(72.5,Project.decimal("72,5"),0.0)
        assertEquals(72.5,Project.decimal("72.5"),0.0)
        assertThrows(IllegalArgumentException::class.java) { Project.parse(example(Model.HALF).json().replace("android-half-1","unknown")) }
    }
    @Test fun circularWaistAndAllowances() {
        for(m in listOf(Model.HALF,Model.FULL)) {
            val p=example(m);val k=Geometry.build(p);val piece=k.pieces[0];val r=73/(if(m==Model.HALF)PI else 2*PI)
            assertEquals(73.0,k.waistLength,1e-9)
            assertEquals(r,hypot(piece.seam.first().x,piece.seam.first().y),1e-9)
            assertEquals(r-p.seam,hypot(piece.cut.first().x,piece.cut.first().y),1e-9)
            assertEquals(73.0+k.project.hipHeight*(if(m==Model.HALF)PI else 2*PI),k.hipCircumference,1e-8)
            assertEquals(if(m==Model.HALF)1 else 2,piece.count)
            assertEquals(m==Model.HALF,piece.fold)
            assertEquals(76.0,k.pieces[1].seam[1].x,1e-9)
        }
    }
    @Test fun fourGoreWidthsSymmetryAndFiniteOffsets() {
        val p=example(Model.GORES);val k=Geometry.build(p);val g=k.pieces[0]
        assertEquals(4,g.count);assertEquals(102.0,k.hipCircumference,1e-8)
        assertEquals(73.0/4,g.seam.first().x*2,1e-8)
        assertEquals((102.0/4+6),g.seam.maxOf { it.x }*2,1e-8)
        g.cut.forEach { assertTrue(it.x.isFinite()&&it.y.isFinite()) }
        assertEquals(-p.seam,g.cut.minOf { it.y },1e-8)
        assertEquals(p.length+p.hem,g.cut.maxOf { it.y },1e-8)
    }
    @Test fun tilingAndMillimetres() {
        assertEquals(283.464566929,100*PdfLayout.PT_PER_MM,1e-8)
        for(a0 in listOf(false,true)) {
            val tiles=PdfLayout.tiles(1800.0,2500.0,a0);val last=tiles.last()
            assertTrue(last.x+(if(a0)821 else 190)>=1800)
            assertTrue(last.y+(if(a0)1169 else 277)>=2500)
        }
    }
    @Test fun invalidInputsRejected() {
        val p=example(Model.HALF)
        for(bad in listOf(p.copy(waist=Double.NaN),p.copy(hip=70.0),p.copy(hipHeight=70.0),p.copy(zip=100.0),p.copy(seam=-1.0))) {
            assertThrows(IllegalArgumentException::class.java) { Geometry.build(bad) }
        }
    }
}