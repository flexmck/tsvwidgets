function altCovData() {
    let arcgisUrl = 'https://services7.arcgis.com/mOBPykOjAyBO2ZKk/ArcGIS/rest/services/RKI_Landkreisdaten/FeatureServer/0/query?where=AdmUnitId+%3D+08118&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=GEN%2CBL%2Ccounty%2Ccases7_per_100k_txt%2Ccases_per_100k%2Ccases7_per_100k%2Clast_update%2Ccases_per_100k%2Ccases7_lk%2Ccases7_bl&returnGeometry=false&returnCentroid=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pjson&token=';

    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (this.status == 200 && this.readyState == 4) {
            let resp = JSON.parse(this.responseText);
            renderData(resp, 1);
        }
    }
    xhr.open('GET', arcgisUrl, !0);
    xhr.send();
}

function renderData(covdata, src) {
    let map = {};
    if (src == 0) {
        let incidence = covdata.data["08118"].weekIncidence.toFixed(1);
        let c7 = incidence.replace(".", ",");
        map.weekIncidence = c7;
        map.lastUpdate = new Date(covdata.meta.lastUpdate).toLocaleString('de-DE') + ' Uhr'

    } else {
        map.weekIncidence = covdata.features[0].attributes.cases7_per_100k_txt;
        map.lastUpdate = covdata.features[0].attributes.last_update;
    }

    // let o = document.getElementById("i_card");
    let d = document.getElementById("i_txt");
    let a = document.getElementById("i_last_update");
    d.innerText = map.weekIncidence;
    a.innerText = map.lastUpdate;

}

function getWeeklyIncidence() {
    let e = new XMLHttpRequest();
    e.onreadystatechange = function () {
        if (200 == this.status && 4 == this.readyState) {
            let resp = JSON.parse(this.responseText)


            if (resp.hasOwnProperty('error')) {
                altCovData();
            } else {
                renderData(resp, 0);
            }
        }
    }
    e.open("GET", "https://api.corona-zahlen.org/districts/08118", !0);
    e.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    e.send();
}


function getRegulations() {

    let appurl = 'https://raw.githubusercontent.com/flexmck/tsvwidgets/main/appdata.json';
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (this.status == 200 && this.readyState == 4) {
            let resp = JSON.parse(this.responseText);
            document.getElementById('m_default').innerHTML = '';
            for (let i = 0; i < resp.rules.length; i++) {
                if (Array.isArray(resp.rules[i].value)) {
                    let elm = document.createElement(resp.rules[i].element);
                    for (let p = 0; p < resp.rules[i].value.length; p++) {
                        let item = document.createElement('li');
                        item.innerText = resp.rules[i].value[p];
                        elm.appendChild(item);
                    }

                    document.getElementById('m_default').appendChild(elm);
                } else {
                    let elm = document.createElement(resp.rules[i].element);
                    elm.innerText = resp.rules[i].value;
                    document.getElementById('m_default').appendChild(elm);
                }
            }
            for (let t = 0; t < resp.legal.length; t++) {
                document.getElementById('legal_' + (t + 1)).innerText = resp.legal[t].label;
                document.getElementById('legal_' + (t + 1)).href = resp.legal[t].url;
            }
            document.getElementById('timestamp').innerText = resp.timestamp;
        }
    }
    xhr.open('GET', appurl, !0);
    xhr.send();
}


function getIcuNumbers() {
    let url = 'https://raw.githubusercontent.com/robert-koch-institut/COVID-19-Hospitalisierungen_in_Deutschland/master/Aktuell_Deutschland_COVID-19-Hospitalisierungen.csv';
    let divi = 'https://europe-west3-brdata-corona.cloudfunctions.net/diviApi/query?area=BW&indicator=Patienten&filetype=json';

    var result = [];
    let rawFile = new XMLHttpRequest();
    rawFile.onreadystatechange = function () {
        if (this.status == 200 && this.readyState == 4) {
            let response = this.responseText;

            var lines = response.split("\n");

            var headers = lines[0].split(",");
            for (var i = 1; i < lines.length; i++) {
                if (lines[i].includes('Baden-Württemberg,08,00+')) {
                    var obj = {};
                    var currentline = lines[i].split(",");
                    for (var j = 0; j < headers.length; j++) {
                        obj[headers[j]] = currentline[j];
                    }
                    result.push(obj);
                    break;
                } else { continue; }
            }

            let diviZahl = 0;
            let xmp = new XMLHttpRequest();
            xmp.onreadystatechange = function () {
                if (this.status == 200 && this.readyState == 4) {
                    let int = JSON.parse(this.responseText);

                    let latest = int.length - 1;
                    console.log('Belegung Intensivbetten BW:' + int[latest].faelleCovidAktuell);
                    diviZahl = int[latest].faelleCovidAktuell;

                    let car = document.getElementById('card_warnstufe');
                    let dat = document.getElementById('date_warnstufe');
                    let lab = document.getElementById('label_warnstufe');
                    let ico = document.getElementById('icon_warnstufe');
                    let rate = parseFloat(result[0]['7T_Hospitalisierung_Inzidenz']);
                    let date = result[0]['Datum'];
                    dat.innerText = 'Stand: ' + new Date(date).toLocaleDateString('de-DE');
                    console.log('Hospitalisierungsrate BW: ' + rate);
                    document.getElementById('value_warnstufe').innerText = JSON.stringify(rate).replace('.', ',');
                    document.getElementById('value_hospinz').innerText = diviZahl.toString();


                    if (rate >= 15 || diviZahl >= 390) {
                        console.log('ALARM');

                        lab.innerText = 'ALARMSTUFE';
                        lab.classList.add('text-danger');
                        ico.classList.add('bg-danger');
                        car.classList.add('border-danger');


                    } else if (4 <= rate && rate <= 14.9 || diviZahl >= 250 && diviZahl <= 389) {
                        console.log('WARN');

                        lab.innerText = 'WARNSTUFE';
                        lab.classList.add('text-warning');
                        ico.classList.add('bg-warning');
                        car.classList.add('border-warning');

                    } else if (rate <= 3.9 || diviZahl <= 249) {
                        console.log('BASIS');

                        lab.innerText = 'BASISSTUFE';
                        lab.classList.add('text-success');
                        ico.classList.add('bg-success');
                        car.classList.add('border-success');
                    }

                    car.classList.remove('d-none');
                }


            }
            xmp.open('GET', divi, !0);
            xmp.send();
        }
    }
    rawFile.open('GET', url, !0);
    rawFile.send();

}


!(function () {
    try {
        getWeeklyIncidence();
    } catch (error) {
        throw 'Could not load weekly incidence'
    }

    try {
        getRegulations();
    } catch (error) {
        throw 'Could not load regulations'
    }

    try {
        getIcuNumbers();
    } catch (error) {
        throw 'Could not load icu numbers'
    }
})();