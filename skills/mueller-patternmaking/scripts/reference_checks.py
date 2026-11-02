"""Verify selected source arithmetic, not a complete pattern generator."""
import json,math

def positive(value):
    value=float(str(value).replace(',','.'))
    if not math.isfinite(value) or value<=0:raise ValueError('A finite positive measure is required')
    return value

def women_width_control(bust_cm):
    bust=positive(bust_cm)
    if bust<80:raise ValueError('The cited table is specified for bust 80 cm and above')
    back=bust/8+5.5;armhole=bust/8-1.5;front=bust/4-4
    return {'back':back,'armhole':armhole,'front':front,'sum':back+armhole+front,'half_bust':bust/2}

def skirt_intake(waist,hips,half_hip_ease=1,half_waist_ease=1):
    waist=positive(waist);hips=positive(hips)
    return hips/2+half_hip_ease-(waist/2+half_waist_ease)

def main():
    checks=[]
    for waist,expected,parts in [(76,12,[7,2,3]),(72,14,[7,2,3,2])]:
        assert math.isclose(skirt_intake(waist,100),expected)
        assert math.isclose(sum(parts),expected)
        checks.append({'case':'b01 skirt waist '+str(waist),'pdf_pages':[3,4,5],'intake_cm':expected,'parts_cm':parts})
    for bust in (80,92,100,116,134):
        values=women_width_control(bust)
        assert math.isclose(values['sum'],values['half_bust'])
    assert women_width_control('92,0')['sum']==46
    assert math.isclose(106-26.5,79.5)
    assert math.isclose(79.5/2-79.5/10,31.8)
    assert math.isclose(100/4-1,24)
    assert math.isclose(100/4+1,26)
    checks.append({'case':'b01 trouser reference','pdf_page':8,'inside_length_cm':79.5,'crotch_to_knee_cm':31.8})
    assert math.isclose((92-78)/5,2.8)
    assert math.isclose(16.5+9.5+20,46)
    checks.append({'case':'b03 bodysuit reference','pdf_page':2,'additional_dart_cm':2.8,'width_control_cm':46})
    assert math.isclose(100*72/25.4,283.46456692913387)
    for invalid in ('nan','inf',0,-1):
        try:positive(invalid)
        except ValueError:continue
        raise AssertionError('Invalid measure accepted')
    try:women_width_control(76)
    except ValueError:pass
    else:raise AssertionError('Out-of-range source formula was used')
    print(json.dumps({'ok':True,'scope':'selected source arithmetic only; no full pattern or physical-fit validation','references':checks},ensure_ascii=False,indent=2))

if __name__=='__main__':main()
