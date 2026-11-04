package ru.bumbari.patterns

import org.junit.Assert.*
import org.junit.Test
import kotlin.math.*

class PatternTest {
    private fun example(m:Model)=Project(model=m,name="Демонстрационный пример",waist=72.0,hip=100.0,hipHeight=20.8,length=61.5,
        seam=if(m==Model.STRAIGHT)2.0 else 1.0,hem=if(m==Model.STRAIGHT)4.0 else 1.0)
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
    @Test fun straightSkirtUsesBookIntakeAndCompletePieces() {
        val p=example(Model.STRAIGHT);val k=Geometry.build(p);val (front,back,belt)=k.pieces
        assertEquals(74.0,k.waistLength,1e-9)
        assertEquals(102.0,k.hipCircumference,1e-9)
        assertEquals(1,front.count);assertTrue(front.fold)
        assertEquals(2,back.count);assertFalse(back.fold)
        assertTrue(back.title.contains("шлица"))
        assertEquals(2.0,front.marks.first { it.size==3 }.let { it[2].x-it[0].x },1e-9)
        assertEquals(listOf(2.0,3.0),back.marks.filter { it.size==3 }.map { it[2].x-it[0].x }.sorted())
        assertEquals(22.0,front.seam[2].x,1e-9)
        assertEquals(20.0,front.seam[1].x,1e-9)
        assertEquals(17.0,back.seam[1].x,1e-9)
        assertEquals(74.0,belt.seam[2].x,1e-9)
        assertEquals(0.0,front.cut.minOf { it.x },1e-9)
        assertEquals(65.5,back.cut.maxOf { it.y },1e-9)
        assertEquals(-5.0,back.cut.minOf { it.x },1e-9)
        assertEquals(1,front.marks.count { it.size==3 })
        assertEquals(2,back.marks.count { it.size==3 })
        (front.cut+back.cut).forEach { assertTrue(it.x.isFinite()&&it.y.isFinite()) }
        val v1=p.copy(algorithm=p.model.algorithm).json().replace("\"version\": 2","\"version\": 1")
        assertThrows(IllegalArgumentException::class.java) { Project.parse(v1) }
        val oldCircle=example(Model.HALF).json().replace("\"version\": 2","\"version\": 1")
        assertEquals(example(Model.HALF).copy(id=Project.parse(oldCircle).id),Project.parse(oldCircle))
        val firstBookCase=Geometry.build(p.copy(waist=76.0))
        assertEquals(78.0,firstBookCase.waistLength,1e-9)
        assertEquals(1,firstBookCase.pieces[1].marks.count { it.size==3 })
        assertEquals(3.0,firstBookCase.pieces[1].marks.first { it.size==3 }.let { it[2].x-it[0].x },1e-9)
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
    @Test fun updateManifestIsPinnedToTheAppAndReleaseHost() {
        val manifest="""{"versionCode":3,"versionName":"0.3.0","packageName":"ru.bumbari.patterns","apkUrl":"https://github.com/zelimhan2332/bumbari-preview/releases/download/android-v0.3.0/bumbari-android-release.apk","sha256":"${"a".repeat(64)}"}"""
        val update=AppUpdateClient.parseManifest(manifest,"ru.bumbari.patterns")
        assertEquals(3L,update.versionCode)
        assertEquals("0.3.0",update.versionName)
        assertEquals("a".repeat(64),update.sha256)
        assertThrows(IllegalArgumentException::class.java) { AppUpdateClient.parseManifest(manifest,"other.package") }
        assertThrows(IllegalArgumentException::class.java) { AppUpdateClient.parseManifest(manifest.replace("https://github.com/zelimhan2332/bumbari-preview/releases/download", "http://evil.example"),"ru.bumbari.patterns") }
        assertThrows(IllegalArgumentException::class.java) { AppUpdateClient.parseManifest(manifest.replace("a".repeat(64),"bad"),"ru.bumbari.patterns") }
    }
}
