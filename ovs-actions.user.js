// ==UserScript==
// @name          Actions OVS
// @namespace     http://yopai.hd.free.fr/onvasortir.com
// @description   Ajoute diverses choses à l'interface d'OVS.
// @include       http://*.onvasortir.com/*
// @version       1.2
// @require https://raw.githubusercontent.com/kvz/phpjs/master/functions/var/serialize.js
// @require https://raw.githubusercontent.com/kvz/phpjs/master/functions/var/unserialize.js
// @require http://www.javascripttoolbox.com/libsource.php/table/compact/table.js
// @require  https://raw.githubusercontent.com/Yopai/script-lib/master/xpath-utils.js
// @require  https://raw.githubusercontent.com/Yopai/script-lib/master/math-utils.js
// @require  https://raw.githubusercontent.com/Yopai/script-lib/master/vanilla-utils.js
// @grant       GM_xmlhttpRequest
// ==/UserScript==

//-------------------------------------
function decode_data(callback, id_sortie, response) {
    var el = document.createElement( 'div' );
    el.innerHTML = response.responseText;
    data = store_data(id_sortie, el);
    if (callback) {
       callback(data);
    }
}

//-------------------------------------
function store_data(id_sortie, el) {
	data = lsdata(id_sortie);
    var t;
    if (t = xget(el, './/*[contains(text(), "Adresse exacte")]', 1)) {
       t = t.parentNode.parentNode.parentNode.parentNode.parentNode;
       data.city = t.nextElementSibling.childNodes[3].childNodes[1].childNodes[0].nodeValue;
    }
    if (t = xget(el, './/*[contains(text(), "Liste des inscrits")]', 1)) {
       data.nb_inscrits = parseInt(t.textContent.match(/(\d+)\/\d+ reste/)[1], 10);
       t = t.parentNode.parentNode.parentNode.parentNode.parentNode;
       t = t.nextElementSibling.nextElementSibling;
       data.inscrits = [];
       ages = [];
       while (t) {
           var as = xget(t, './td//a[@onmouseover]', 'all');
           for (i=0; i < as.length; i++) {
               a = as[i];
               data.inscrits[data.inscrits.length] = a.textContent;
               m = a.getAttribute('onmouseover').match(/<BR>(\d+) ans/);
               if (m) {
                   ages[ages.length] = 1*m[1];
               }
           }
           t = t.nextElementSibling;
       }
       data.stats.age_inscrits.min = Math.min.apply(null, ages);
       data.stats.age_inscrits.max = Math.max.apply(null, ages);
       data.stats.age_inscrits.med = median(ages);
       data.stats.age_inscrits.avg = mean(ages);
    }

	data.maj = Date.now();
    if (localStorage) {
	   localStorage['data_' + id_sortie] = serialize(data);
    }
    return data;
}

//-------------------------------------
function lsdata(id_sortie) {
    data = {
		city : null,
		maj : null,
		inscrits: null,
        nb_inscrits: null,
        stats : {
            age_inscrits : {
                min: null,
                max: null,
                med : null,
                avg : null
            }
        }
	};
    if (localStorage && typeof (localStorage['data_' + id_sortie]) != 'undefined') {
		ls = unserialize(localStorage['data_' + id_sortie]);
		if (typeof ls.city != 'undefined') { data.city = ls.city; }
		if (typeof ls.maj != 'undefined') { data.maj = ls.maj; }
		if (typeof ls.inscrits != 'undefined') { data.inscrits = ls.inscrits; }
		if (typeof ls.nb_inscrits != 'undefined') { data.nb_inscrits = ls.nb_inscrits; }
		if (typeof ls.stats.age_inscrits.min != 'undefined') { data.stats.age_inscrits.min = ls.stats.age_inscrits.min; }
		if (typeof ls.stats.age_inscrits.max != 'undefined') { data.stats.age_inscrits.max = ls.stats.age_inscrits.max; }
		if (typeof ls.stats.age_inscrits.med != 'undefined') { data.stats.age_inscrits.med = ls.stats.age_inscrits.med; }
		if (typeof ls.stats.age_inscrits.avg != 'undefined') { data.stats.age_inscrits.avg = ls.stats.age_inscrits.avg; }
    }
	return data;
}

//-------------------------------------
var max_load_page = -1;
function get_data(id_sortie, a, callback) {
    href = a.href;
    nb_inscrits_str = a.parentNode.nextElementSibling.textContent;
    nb_inscrits = parseInt(nb_inscrits_str, 10);
	data = lsdata(id_sortie);
	if (data.maj && data.nb_inscrits == nb_inscrits) {
		callback(data);
	}
    else if (max_load_page) {
		if (typeof(GM_xmlhttpRequest) == 'undefined') {
			alert('undefined GM_xmlhttpRequest');
			max_load_page = 0;
		}
		else {
			GM_xmlhttpRequest({
				method: 'GET',
				url: href,
				onload: decode_data.curry(callback, id_sortie)
			});
			max_load_page--;
		}
    }
}

//-------------------------------------
function add_header(a) {
    console.log(a);
    var head_tr = a.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.childNodes[0];
    // head_tr.childNodes[5].innerHTML = '** SORTIE**';  return;

    console.log(head_tr);
    head_tr.childNodes[5].colSpan="4";
    new_tr = document.createElement('tr');
    td = document.createElement('td'); td.width="1%"; new_tr.appendChild(td);
    td = document.createElement('td'); td.width="100"; new_tr.appendChild(td);
    td = document.createElement('td'); td.width="1%"; new_tr.appendChild(td);
    td = document.createElement('td'); td.style.width = '120px'; new_tr.appendChild(td); td.innerHTML = 'Ville';
    td = document.createElement('td'); td.style.width = '40px'; new_tr.appendChild(td); td.innerHTML = 'Ãge'; td.title = 'Ãge mÃ©dian';
    td = document.createElement('td'); new_tr.appendChild(td);
    td = document.createElement('td'); td.width="35"; new_tr.appendChild(td);
    td = document.createElement('td'); td.width="120"; new_tr.appendChild(td);
    console.log(head_tr.parentNode);
    console.log(new_tr);
    head_tr.parentNode.insertBefore(new_tr, head_tr.nextElementSibling);
}
//-------------------------------------
function transform_td(a) {
    td_img = a.parentNode.previousSibling;
    td_link = a.parentNode;
    td = td_link.parentNode.parentNode.parentNode.parentNode;
    tr = td.parentNode;
    tr.insertBefore(td_img, td);
    tr.insertBefore(td_link, td);
    tr.removeChild(td);

    td = document.createElement('td');
    td.style.width = '120px';
    td.innerHTML = '...';

    tr.insertBefore(td, td_link);
    td = document.createElement('td');
    td.style.width = '40px';
    td.innerHTML = '...';
    tr.insertBefore(td, td_link);
}

//-------------------------------------
function set_data(a, data) {
    td_link = a.parentNode;
    td = td_link.previousElementSibling.previousElementSibling;
    td.innerHTML = data.city;

    td = td_link.previousElementSibling;
    if (data.stats.age_inscrits.med) {
       td.innerHTML = data.stats.age_inscrits.med;
    }
    else {
        td.innerHTML = '';
    }
}

//-------------------------------------
function add_data(a) {
    var patt = /.*-(\d+).html/g;
    r = patt.exec(a.href);
    id_sortie = r[1];
    get_data(id_sortie, a, set_data.curry(a));
}

//-------------------------------------
function add_friend(a) {
    var href = a.href.replace(/profil_read.php./, 'ami_action_create.php?Ami=') + '&Comm=';
    var link = document.createElement('a');
    link.href = href;
    link.title = 'Ajouter Ã  mes amis';
    link.target = 'ajout_amis';
    link.addEventListener('click', function (event) {
        w = window.open(this.href, '_blank');
        setTimeout(w.close.bind(w), 2000);
        event.preventDefault();
    }, true);
    link.innerHTML = '[+]';
    a.parentNode.insertBefore(link, a.nextSibling);

    m = a.getAttribute('onmouseover').match(/<BR>(\d+) ans/);
    if (m) {
       text = document.createTextNode(' (' + m[1] + ')');
       a.parentNode.insertBefore(text, a.nextSibling);
    }
}

//---------------------------------------
var form1;
function add_cbx_tous() {
	tables = xget(document, "//table", 'all');
	var table = tables[12];

	var tr = document.createElement('tr');
	var td = document.createElement('td');
	td.innerHTML = '<input type="checkbox" id="select_all" />';
	td.firstElementChild.onclick = function() {
		var xpr = document.evaluate('.//input[@type="checkbox"]', this.parentNode.parentNode.parentNode, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
		for (i=0; i < xpr.snapshotLength; i++) {
			e = xpr.snapshotItem(i);
			if (!e.id.match(/^select_all/)) {
				e.checked = this.checked;
			}
		}
	};
	tr.appendChild(td);
	td = document.createElement('td');
	td.innerHTML = '<label for="select_all">Sélectionner tous mes amis</label>';
	td.setAttribute('colspan', 5);
	tr.appendChild(td);
	table.appendChild(tr);

	tr = document.createElement('tr');
	td = document.createElement('td');
	td.innerHTML = '<input type="checkbox" id="select_all_active" />';
	td.firstElementChild.onclick = function() {
		var xpr = document.evaluate('.//input[@type="checkbox"]', this.parentNode.parentNode.parentNode, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
		for (i=0; i < xpr.snapshotLength; i++) {
			e = xpr.snapshotItem(i);
			if (!e.id.match(/^select_all/) && !e.parentNode.nextElementSibling.firstElementChild.firstElementChild.src.match(/ami_enveille/)) {
				e.checked = this.checked;
			}
		}
	};
	tr.appendChild(td);
	td = document.createElement('td');
	td.innerHTML = '<label for="select_all_active">Sélectionner tous mes amis (sauf en veille)</label>';
	td.setAttribute('colspan', 5);
	tr.appendChild(td);
	table.appendChild(tr);
}

//-------------------------------------
var links,i;
links = xget(document, "//a[contains(@href, 'profil_read.php')]", 'all');
for (i = 0; i < links.length; i++) {
    // liens de profil d'utilisateur, ajoute un [+] pour ajouter aux amis
    add_friend(links[i]);
}

if (document.URL.match(/vue_(sortie|infos)/)) {
    // liste de sorties, ajoute les infos (ville, stats)
    links = xget(document, "//a[contains(@href, '.html')]", 'all');
    header = false;
    for (i = 0; i < links.length; i++) {
       if (links[i].href.match(/.*-[0-9]+\.html/)) {
          if (!header) {
              add_header(links[i]);
              header = true;
          }
          transform_td(links[i]);
          add_data(links[i]);
       }
    }
    console.log(Table);
    Table.table.auto();
}
else if (m = document.URL.match(/.*-([0-9]+)\.html/)) {
    store_data(m[1], document);
}
else if (document.URL.match(/vue_profil_amis/)) {
	add_cbx_tous();
}
