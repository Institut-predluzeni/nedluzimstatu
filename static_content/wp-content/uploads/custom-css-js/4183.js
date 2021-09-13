<!-- start Simple Custom CSS and JS -->
<script type="text/javascript">
jQuery(function($){
	zobrazitKrok(1);
  	$('#krok-1-checked').click(function(e) {
       zobrazitKrok(1);
    });
  	$('#btnVyberInstituci').click(function () {
        /* function for validation of choosen institution of checkboxes in step 01 - runs only at page GENEROVANI DOKUMENTU */
        //Reference the Group of CheckBoxes and verify whether at-least one CheckBox is checked.
        var checked = $("#pdf-dotaznik-01 input[type=checkbox]:checked").length;
        //Set the Valid Flag to True if at-least one CheckBox is checked.
        var isValid = checked > 0;
        //Display error message if no CheckBox is checked and scroll there
        $("#instituce-error")[0].style.display = isValid ? "none" : "block";
      	document.getElementById('instituce-error').scrollIntoView({behavior: 'smooth'});
		if (!isValid) return;
      
        // valid selection, show next step
        zobrazitKrok(2);     
      
        jQuery('input[name="pojistovny[]"').each(function(index) {
        if (this.checked) {
           // load and store selected detail info before final submit
           detailOvm2(zdravotniPojistovny[this.value], this.value);
        }});
          
        // prefill form with test data - devel only
        var testEmail = new URL(location.href).searchParams.get('test-data');
        var testEmail2 = new URL(location.href).searchParams.get('test-data-pobocky');
        if (testEmail || testEmail2) {
     	    $('#pdf-dotaznik-02 input[name="jmeno"]').val('Jméno');
            $('#pdf-dotaznik-02 input[name="prijmeni"]').val('Příjmení');
			$('#pdf-dotaznik-02 input[name="rodne-cislo"]').val('000718/1746');
            $('#pdf-dotaznik-02 input[name="ulice-cislo"]').val('Ulice č.p. 1');
            $('#pdf-dotaznik-02 input[name="cast-obce"]').val('Část obce');
            $('#pdf-dotaznik-02 input[name="mesto-obec"]').val('Obec');
            $('#pdf-dotaznik-02 input[name="psc"]').val('12345');
            $('#pdf-dotaznik-02 input[name="email"]').val(testEmail ?? testEmail2);
            $('#pdf-dotaznik-02 input[name="telefon"]').val('123456789');
            $('#pdf-dotaznik-02 input[name="checkbox-adresa[]"')[0].checked = true;          
		}
    });
});

var pscUrl = 'https://www.nedluzimstatu.cz/public/psc2ovm/psc_obce_2021.json';
var apiUrl = 'https://tools.cesko.dev/api/nedluzimstatu/';

// formatted from OVM api
var detailObce = {};
var detailUradu = {};
// fix OVM IDs
var zdravotniPojistovny = { 
  'Všeobecná zdravotní pojišťovna': '8dd393b5-d3d3-4862-92d3-ea47f91977b7',
  'Oborová zdravotní pojišťovna':'15e4cbeb-37bd-48d6-a5aa-5b404978692f',
  'Česká průmyslová zdravotní pojišťovna':'4f7900cd-f49c-43f0-8d4c-0c0cf31137da',
  'Vojenská zdravotní pojišťovna': '3dffefe3-ed94-4781-83e7-f876a14ecc87',
  'Zaměstnanecká pojišťovna Škoda': '87a305f7-8063-42e3-83ea-4d5352c3c9f0',
  'Revírní bratrská pokladna – zdravotní pojišťovna': '90511a52-10e3-4952-8a2e-5c2691640644',
  'Zdravotní pojišťovna Ministerstva vnitra ČR': '80cf8802-65c3-47f5-8668-7d74b3233aea',
};
// checkbox -> mail service
var prekladInstituci = {
    'Finanční úřad': 'financni-urad',
    'Česká správa sociálního zabezpečení': 'ossz',
    'Celní správa / Policie ČR': 'celni-sprava',
    'Obec': 'obec',
    };

function odeslatFormular(pdfDotaznik) {
  if (!jQuery(pdfDotaznik).valid()) {
        console.log('pdfdotaznik invalid');
    	return false;
  }
  jQuery('#pdf-dotaznik-02 .button-pdf-form')[0].disabled = true;
  jQuery('#pdf-dotaznik-02 .button-pdf-form').addClass('btn-loading');
  jQuery('#pdf-dotaznik-02 .button-pdf-form .desktop-label').text('Generujeme žádosti');
  jQuery('#pdf-dotaznik-02 .button-pdf-form .mobile-label').text('Generujeme žádosti');  
  jQuery('#pdf-dotaznik-error').addClass('d-none');
  console.log('submit pdfdotaznik via js');
  
  var testEmail = new URL(location.href).searchParams.get('test-data');
  var testEmail2 = new URL(location.href).searchParams.get('test-data-pobocky');
  var data1 = jQuery('#pdf-dotaznik-01 form').serializeArray();
  var data2 = Object.fromEntries(new FormData(jQuery('#pdf-dotaznik-02 form')[0]));
  var apiData = {
     "recipientEmail": data2.email,
     "recipients": {
     },
     "applicant": {
       "name": data2.jmeno,
       "surname": data2.prijmeni,
       "phone": data2.telefon,
       "email": data2.email,
       "personal_identification_number": data2['rodne-cislo'],
       "address": {
         "lines": [data2['ulice-cislo'], data2['cast-obce']],
         "city": data2['mesto-obec'],
         "zip_code": data2.psc,
       },
     },
     "reply_to": {
    	"reply_to": {
    	}
  	 },
  	 "reason": {
     	"other": data2['ucel-vydavani'],
  	 },
  };
  // detect selected institutions
  jQuery('input[name="statni-instituce[]"').each(function(index) {
    if (this.checked && prekladInstituci[this.value]) {
        if (prekladInstituci[this.value] in detailUradu) {
          // store detail info if loaded
          apiData['recipients'][prekladInstituci[this.value]] = urad2api(detailUradu[prekladInstituci[this.value]]);
        } else {      
          apiData['recipients'][prekladInstituci[this.value]] = {"name":this.value};
        }
        console.log(this.value);
      	if (testEmail) {// debug for direct pdf call, only last value is used
        	apiData['recipient'] = {"name":this.value};
        }
    }
  });
  jQuery('input[name="pojistovny[]"').each(function(index) {
    if (this.checked) {
        if (!('pojistovna' in apiData['recipients'])) {
          apiData['recipients']['pojistovna'] = [];
        }
        // store selected detail info if loaded
        if (this.value in detailUradu) {
          // store detail info if loaded
          apiData['recipients']['pojistovna'].push(urad2api(detailUradu[this.value]));
      	  if (testEmail2) {// debug for direct pdf call, only last value is used
        	apiData['recipient'] = urad2api(detailUradu[this.value]);;
          }  
        } else {
          apiData['recipients']['pojistovna'].push({"name":this.value});
        }

        console.log(this.value);
    }    
  });
  if (data2['ucel-vydavani'] == 'Jiný účel (prosím uveďte)')  {
    apiData['reason']['other'] = data2['jiny-ucel-popis'];
  }

  if (data2['doruceni-odpovedi'] == 'Českou poštou') {
    if (data2['checkbox-adresa[]']) {
      apiData['reply_to']['reply_to']['permanent_addres'] = true;
    } else {
      apiData['reply_to']['reply_to']['contact_address'] = {
         "lines": [data2['dorucovaci-ulice-cislo'], data2['dorucovaci-cast-obce']],
         "city": data2['dorucovaci-mesto-obec'],
         "zip_code": data2['dorucovaci-psc'],
      }
    }
  } else if (data2['doruceni-odpovedi'] == 'Do datové schránky') {
    apiData['reply_to']['reply_to']['data_box'] = data2['datova-schranka'];
  } else if (data2['doruceni-odpovedi'] == 'Odpověď si vyzvednu osobně na pobočce') {
    apiData['reply_to']['reply_to']['in_person'] = true;
  }
  console.log(data1);
  console.log(data2);
  console.log(apiData);
    // tmp, remove! Set up AJAX settings for binary files:
    var xhrOverride = new XMLHttpRequest();
    xhrOverride.responseType = 'arraybuffer';

  jQuery.ajax({
    url: 'https://www.nedluzimstatu.cz/mail-service/zadosti',
    //dev:
    //url: 'https://nedluzimstatu.cz/transformation-service/financni-urad',
    type: 'POST',
	//dataType:"json",
    // tmp dev:
    dataType: 'binary',
    processData: false,
    xhr: function() {
        return xhrOverride;
    },
    data: JSON.stringify(apiData),
    contentType: 'application/json',
    //success: function(data){
    statusCode: {
        200: function(data) {
             zobrazitKrok(3);
          	 jQuery('.et_pb_blurb_description #odeslanyEmail')[0].textContent = data2.email;
        },
      // dev:
        201: function(data){
          jQuery('#pdf-dotaznik-02 .button-pdf-form')[0].disabled = false;
          jQuery('#pdf-dotaznik-02 .button-pdf-form').removeClass('btn-loading');
  	      jQuery('#pdf-dotaznik-02 .button-pdf-form .desktop-label').text('Vygenerovat a poslat na e-mail');
  		  jQuery('#pdf-dotaznik-02 .button-pdf-form .mobile-label').text('Vygenerovat žádosti');           
          var blob = new Blob([data], {type: 'application/pdf'});
          var fileName = 'output.pdf';
          var link=document.createElement('a');
          link.href=window.URL.createObjectURL(blob);
          link.download=fileName;
          link.click();
        },
    },
    error: function (xhr, ajaxOptions, thrownError) {
    	jQuery('#pdf-dotaznik-error').removeClass('d-none');
      	document.getElementById('seznam-kroku-02').scrollIntoView({behavior: "smooth", block: "start", inline: "start"});
        jQuery('#pdf-dotaznik-02 .button-pdf-form')[0].disabled = false;
    	jQuery('#pdf-dotaznik-02 .button-pdf-form').removeClass('btn-loading');
  	    jQuery('#pdf-dotaznik-02 .button-pdf-form .desktop-label').text('Vygenerovat a poslat na e-mail');
  		jQuery('#pdf-dotaznik-02 .button-pdf-form .mobile-label').text('Vygenerovat žádosti');        
    },
  });
	return false; // do not submit form via html
}

// load detail from api
function detailOvm2(uid, typUradu) {
  var $ = jQuery;
  if (uid == null) {
    console.log('detailOvm: null nelze nacist');
    return;
  }
  $.ajax({
  	url: apiUrl + 'ovm/'+uid,
  }).done(function( data ) {
    if (typeof data.id !=='undefined') {
      detailUradu[typUradu] = data;
    }
  });
}

function urad2api (urad) {
  var apiData = {};
  if ('IdDS' in urad) {
    apiData['data_box'] = urad['IdDS'];
  }
  if ('Nazev' in urad) {
    apiData['name'] = urad['Nazev'];
  }
  if ('AdresaUradu' in urad) {
    var adresaPole = {'UliceNazev':'', 'CisloDomovni': ' ', 'CisloOrientacni': '/'};
    var adresaUlice = '';
    if (!urad.AdresaUradu.hasOwnProperty('UliceNazev')) {
      // chybi info o ulici, kopie obce
      	adresaUlice = adresaUlice.concat(urad.AdresaUradu.ObecNazev);
    }
    for (key in adresaPole) {
      if (urad.AdresaUradu.hasOwnProperty(key)) {
        adresaUlice = adresaUlice.concat(adresaPole[key]+urad.AdresaUradu[key]);
      }
    }

    apiData['address'] = {
      'lines': [adresaUlice],
      'city': urad.AdresaUradu.ObecNazev,
      'zip_code': urad.AdresaUradu.PSC,
    };
  }
  return apiData;
}

function zobrazitKrok(cislo) {
  console.log('krok:'+cislo);
  if (cislo == 1) {
    jQuery('#sekce-krok-01').removeClass('d-none');   
    jQuery('#sekce-krok-02').addClass('d-none');    
    jQuery('#sekce-krok-03').addClass('d-none');
    jQuery('#pdf-dotaznik-error').addClass('d-none');
  } else if (cislo == 2) {
    jQuery('#sekce-krok-01').addClass('d-none');
    jQuery('#sekce-krok-02').removeClass('d-none');    
    jQuery('#sekce-krok-03').addClass('d-none');
    jQuery('#seznam-kroku-02')[0].scrollIntoView({behavior: "smooth", block: "start", inline: "start"});
  } else if (cislo == 3) {
    jQuery('#sekce-krok-01').addClass('d-none');
    jQuery('#sekce-krok-02').addClass('d-none');     
    jQuery('#sekce-krok-03').removeClass('d-none');
    jQuery('#seznam-kroku-03')[0].scrollIntoView({behavior: "smooth", block: "start", inline: "start"});
  } // else nothing
}</script>
<!-- end Simple Custom CSS and JS -->
