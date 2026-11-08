(function(){
'use strict';
var $=function(id){return document.getElementById(id)};
var KEY='tomz_prefs_v1';
var D={name:'',phone:'',tpl:'I need help. Please contact me as soon as possible. My current location is: [LOCATION]',low:false,sound:true,speak:true,api:'',safe:false,lang:'en-US'};
var P=load();
function load(){try{return Object.assign({},D,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){return Object.assign({},D)}}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(P))}catch(e){toast('Could not save on this browser.')}}
function toast(t){var el=$('toast');el.textContent=t;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(function(){el.classList.remove('show')},2600)}
function copy(txt){
  if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(txt).then(function(){toast('Copied')},function(){fallback()})}else fallback();
  function fallback(){var t=document.createElement('textarea');t.value=txt;document.body.appendChild(t);t.select();try{document.execCommand('copy');toast('Copied')}catch(e){toast('Copy failed. Select the text and copy manually.')}t.remove()}
}

/* ---------- clock & greeting ---------- */
function tick(){var d=new Date(),h=d.getHours();
  $('time').textContent=d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  $('date').textContent=d.toLocaleDateString([],{weekday:'short',day:'numeric',month:'short'});
  $('greet').textContent=(h<12?'Good morning':h<18?'Good afternoon':'Good evening')+'. I am Tomz.'}
tick();setInterval(tick,30000);

/* ---------- settings ---------- */
function applyPrefs(){
  $('cName').value=P.name;$('cPhone').value=P.phone;$('msgTpl').value=P.tpl;
  $('lowFx').checked=P.low;$('sound').checked=P.sound;$('speak').checked=P.speak;$('apiUrl').value=P.api;$('lang').value=P.lang;
  document.body.classList.toggle('low',P.low);
  $('contactState').textContent=P.phone?(P.name||P.phone):'Not set';
  $('safeToggle').setAttribute('aria-pressed',P.safe);$('safeState').textContent=P.safe?'On':'Off';
  $('statusTxt').textContent=P.safe?'Safety mode':'Online';
  $('dot').style.background=P.safe?'#FF7A18':'#2fd37a';
}
$('save').onclick=function(){P.name=$('cName').value.trim();P.phone=$('cPhone').value.replace(/[^\d+]/g,'');
  P.tpl=$('msgTpl').value.trim()||D.tpl;P.low=$('lowFx').checked;P.sound=$('sound').checked;P.speak=$('speak').checked;P.api=$('apiUrl').value.trim();P.lang=$('lang').value;
  persist();applyPrefs();toast('Saved on this phone')};
$('clear').onclick=function(){if(confirm('Delete all saved settings and contacts from this phone?')){try{localStorage.removeItem(KEY)}catch(e){}P=Object.assign({},D);applyPrefs();stopTimer();toast('Local data cleared')}};
function toggleSafe(on){P.safe=on;persist();applyPrefs()}
$('safeToggle').onclick=function(){toggleSafe(!P.safe);reply(P.safe?'Safety mode is on. This is a reminder only. I am not monitoring you in the background, so keep your phone charged and your contact set.':'Safety mode is off.')};
$('contactBtn').onclick=function(){if(P.phone){location.href='tel:'+P.phone}else{toast('Add a contact in Settings first');$('cName').scrollIntoView()}};

/* ---------- chat ---------- */
function add(who,txt){var m=document.createElement('div');m.className='msg '+who;m.textContent=txt;$('log').appendChild(m);$('log').scrollTop=1e5}
var SPEC=window.SpeechRecognition||window.webkitSpeechRecognition;
var voices=[];
function say(txt){
  if(!P.speak||!window.speechSynthesis)return;
  try{speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(txt);u.rate=.98;u.pitch=.8;u.lang=P.lang;
    var v=speechSynthesis.getVoices().filter(function(x){return x.lang.slice(0,2)===P.lang.slice(0,2)})[0];if(v)u.voice=v;
    u.onstart=function(){setMode('speaking')};u.onend=u.onerror=function(){setMode('')};speechSynthesis.speak(u)}catch(e){}
}
function setMode(m){var r=$('reactor');r.classList.toggle('listening',m==='listening');r.classList.toggle('speaking',m==='speaking');
  $('wave').classList.toggle('on',!!m)}
function reply(t){add('ai',t);say(t)}
function T(en,ml){return P.lang==='ml-IN'?ml:en}
var KB=[
 [/flash|torch|ഫ്ലാഷ്|ടോർച്ച്/,function(){flashlight();return T('Checking whether this browser can control the flashlight.','ഫ്ലാഷ്‌ലൈറ്റ് നിയന്ത്രിക്കാൻ ഈ ബ്രൗസറിന് കഴിയുമോ എന്ന് പരിശോധിക്കുന്നു.')}],
 [/sos|emergency|help me|i need help|danger|സഹായം|അപകടം|അടിയന്തര/,function(){openSOS();return T('Opening the emergency screen. Nothing is sent until you choose to call or text. If you are in immediate danger, call your local emergency number.','അടിയന്തര സ്ക്രീൻ തുറക്കുന്നു. നിങ്ങൾ വിളിക്കുകയോ സന്ദേശം അയയ്ക്കുകയോ ചെയ്യുന്നതുവരെ ഒന്നും അയയ്ക്കില്ല. അപകടത്തിലാണെങ്കിൽ ഉടൻ അടിയന്തര നമ്പറിൽ വിളിക്കുക (ഇന്ത്യയിൽ 112).')}],
 [/contact|കോൺടാക്റ്റ്|ബന്ധപ്പെടേണ്ട/,function(){return P.phone?T('Your trusted contact is '+(P.name||P.phone)+'. Tap Contact to call, or open SOS to text.','നിങ്ങളുടെ വിശ്വസ്ത കോൺടാക്റ്റ്: '+(P.name||P.phone)+'. വിളിക്കാൻ Contact അമർത്തുക, സന്ദേശത്തിന് SOS തുറക്കുക.'):T('No trusted contact yet. Add one in Settings.','വിശ്വസ്ത കോൺടാക്റ്റ് ഇല്ല. Settings-ൽ ചേർക്കുക.')}],
 [/where|location|gps|ലൊക്കേഷൻ|എവിടെ/,function(){getLoc();return T('Asking for your location now. Your phone will ask for permission.','ലൊക്കേഷൻ ചോദിക്കുന്നു. ഫോൺ അനുമതി ചോദിക്കും.')}],
 [/timer|check.?in|ടൈമർ/,function(){startTimer();return T('Safety timer started. Keep this page open. I cannot alert anyone if the app closes.','സുരക്ഷാ ടൈമർ തുടങ്ങി. ഈ പേജ് തുറന്നിരിക്കട്ടെ. ആപ്പ് അടച്ചാൽ ആരെയും അറിയിക്കാൻ എനിക്ക് കഴിയില്ല.')}],
 [/safety mode|activate|സുരക്ഷാ മോഡ്/,function(){toggleSafe(true);return T('Safety mode is on. It is a reminder only, not background monitoring.','സുരക്ഷാ മോഡ് ഓണാണ്. ഇത് ഓർമ്മപ്പെടുത്തൽ മാത്രമാണ്, പശ്ചാത്തല നിരീക്ഷണമല്ല.')}],
 [/plan|prepare|travel|trip|യാത്ര|പ്ലാൻ/,function(){return T('A simple safety plan:\n1. Tell someone your route and expected arrival time.\n2. Charge your phone and save an emergency contact.\n3. Start the safety timer.\n4. Know two safe places along the way.\n5. Trust your instincts and leave if something feels wrong.','ലളിതമായ സുരക്ഷാ പ്ലാൻ:\n1. റൂട്ടും എത്തുന്ന സമയവും ആരോടെങ്കിലും പറയുക.\n2. ഫോൺ ചാർജ് ചെയ്യുക, കോൺടാക്റ്റ് സേവ് ചെയ്യുക.\n3. സുരക്ഷാ ടൈമർ തുടങ്ങുക.\n4. വഴിയിൽ സുരക്ഷിതമായ രണ്ട് സ്ഥലങ്ങൾ അറിഞ്ഞിരിക്കുക.\n5. എന്തെങ്കിലും ശരിയല്ലെന്ന് തോന്നിയാൽ ഉടൻ അവിടെ നിന്ന് മാറുക.')}],
 [/night|walk|alone|follow|രാത്രി|ഒറ്റയ്ക്ക്|പിന്തുടർ/,function(){return T('Stay in lit, busy areas, keep your phone in hand, and share your route with someone. If you feel followed, head to a shop or public place and call someone.','വെളിച്ചവും ആളുകളുമുള്ള വഴികളിലൂടെ നടക്കുക, ഫോൺ കയ്യിൽ വെക്കുക, റൂട്ട് ആരോടെങ്കിലും പറയുക. ആരോ പിന്തുടരുന്നെന്ന് തോന്നിയാൽ കടയിലേക്കോ ആളുകളുള്ള സ്ഥലത്തേക്കോ പോകുക, ആരെയെങ്കിലും വിളിക്കുക.')}],
 [/vehicle|car|bike|taxi|auto|cab|driv|വാഹന|ടാക്സി|ഓട്ടോ|ബൈക്ക്/,function(){return T('Vehicle safety: share the vehicle number and your live route with a friend, sit behind the driver in a cab, keep doors unlocked only from the inside, and get out in a busy place if the route looks wrong. Never drive tired.','വാഹന സുരക്ഷ: വാഹന നമ്പറും റൂട്ടും സുഹൃത്തിന് അയയ്ക്കുക, റൂട്ട് തെറ്റാണെന്ന് തോന്നിയാൽ ആളുകളുള്ള സ്ഥലത്ത് ഇറങ്ങുക, ക്ഷീണിച്ച് വാഹനമോടിക്കരുത്, ഹെൽമെറ്റും സീറ്റ് ബെൽറ്റും ധരിക്കുക.')}],
 [/home|house|door|lock|burglar|thief|വീട്|കള്ളൻ|വാതിൽ/,function(){return T('Home safety: lock doors and windows at night, do not open the door to strangers without checking, keep emergency numbers near your phone, and tell a neighbour if you will be away.','വീട്ടിലെ സുരക്ഷ: രാത്രി വാതിലും ജനലും പൂട്ടുക, അപരിചിതർക്ക് പരിശോധിക്കാതെ വാതിൽ തുറക്കരുത്, അടിയന്തര നമ്പറുകൾ ഫോണിനടുത്ത് വെക്കുക, വീട്ടിൽ ഇല്ലെങ്കിൽ അയൽക്കാരനെ അറിയിക്കുക.')}],
 [/rain|flood|storm|lightning|മഴ|വെള്ളപ്പൊക്കം|ഇടി|മിന്നൽ/,function(){return T('Rain and floods: avoid walking or driving through moving water, move to higher ground, stay away from fallen power lines, and keep your phone charged. During lightning, go indoors and avoid trees.','മഴയും വെള്ളപ്പൊക്കവും: ഒഴുകുന്ന വെള്ളത്തിലൂടെ നടക്കുകയോ വാഹനമോടിക്കുകയോ അരുത്, ഉയർന്ന സ്ഥലത്തേക്ക് മാറുക, പൊട്ടിവീണ വൈദ്യുതി ലൈനുകളിൽ നിന്ന് അകലം പാലിക്കുക, ഫോൺ ചാർജ് ചെയ്തുവെക്കുക. ഇടിമിന്നലുള്ളപ്പോൾ കെട്ടിടത്തിനുള്ളിൽ കയറുക, മരച്ചുവട്ടിൽ നിൽക്കരുത്.')}],
 [/scam|fraud|otp|cheat|phishing|തട്ടിപ്പ്|ഓടിപി/,function(){return T('Scam safety: never share OTP, PIN or passwords, even with someone claiming to be a bank or police officer. Hang up and call the official number yourself. In India, report cyber fraud on 1930.','തട്ടിപ്പിൽ നിന്ന് സുരക്ഷ: ബാങ്കോ പോലീസോ ആണെന്ന് പറഞ്ഞാലും OTP, PIN, പാസ്‌വേഡ് ആരുമായും പങ്കുവെക്കരുത്. കോൾ കട്ട് ചെയ്ത് ഔദ്യോഗിക നമ്പറിൽ നിങ്ങൾ തന്നെ വിളിക്കുക. ഇന്ത്യയിൽ സൈബർ തട്ടിപ്പ് 1930-ൽ റിപ്പോർട്ട് ചെയ്യുക.')}],
 [/fire|smoke|തീ|പുക/,function(){return T('Get out, stay out, and call your local emergency number from a safe place. Stay low under smoke and do not use elevators.','പുറത്തിറങ്ങുക, തിരികെ കയറരുത്, സുരക്ഷിത സ്ഥലത്ത് നിന്ന് അടിയന്തര നമ്പറിൽ വിളിക്കുക. പുകയിൽ താഴ്ന്ന് നീങ്ങുക, ലിഫ്റ്റ് ഉപയോഗിക്കരുത്.')}],
 [/hurt|bleed|injur|medical|faint|breath|പരിക്ക്|രക്തം|ശ്വാസം|ബോധം/,function(){return T('For serious injury or trouble breathing, call your local emergency number now. Apply firm pressure to bleeding wounds. I am not a medical professional.','ഗുരുതര പരിക്കോ ശ്വാസതടസ്സമോ ഉണ്ടെങ്കിൽ ഉടൻ അടിയന്തര നമ്പറിൽ വിളിക്കുക. രക്തസ്രാവമുള്ള മുറിവിൽ ശക്തിയായി അമർത്തിപ്പിടിക്കുക. ഞാൻ ഡോക്ടറല്ല.')}],
 [/what can you|features|how do|എന്തൊക്കെ/,function(){return T('I can open the SOS screen, show your location, run a check-in timer, help with the flashlight, and answer safety questions on travel, vehicles, home, floods and scams. I only act when you ask.','SOS സ്ക്രീൻ തുറക്കാനും ലൊക്കേഷൻ കാണിക്കാനും ടൈമർ വെക്കാനും ഫ്ലാഷ്‌ലൈറ്റിന് സഹായിക്കാനും യാത്ര, വാഹനം, വീട്, വെള്ളപ്പൊക്കം, തട്ടിപ്പ് എന്നിവയെക്കുറിച്ച് ഉത്തരം നൽകാനും എനിക്ക് കഴിയും. നിങ്ങൾ പറയുമ്പോൾ മാത്രമേ ഞാൻ പ്രവർത്തിക്കൂ.')}],
 [/hello|hi\b|hey|tomz|ഹലോ|നമസ്കാരം|ഹായ്/,function(){return T('I am here. How can I help you stay safe?','ഞാൻ ഇവിടെയുണ്ട്. സുരക്ഷിതരായിരിക്കാൻ എങ്ങനെ സഹായിക്കണം?')}]
];
function local(q){q=q.toLowerCase();for(var i=0;i<KB.length;i++){if(KB[i][0].test(q))return Promise.resolve(KB[i][1]())}
  return Promise.resolve(T('I am a local assistant with limited answers. Try: "start safety timer", "get my location", "help me", or ask about travel, vehicles, home, floods or scams.','എനിക്ക് പരിമിതമായ ഉത്തരങ്ങളേ അറിയൂ. "ടൈമർ", "ലൊക്കേഷൻ", "സഹായം" എന്നിവ പറയുക, അല്ലെങ്കിൽ യാത്ര, വാഹനം, വീട്, വെള്ളപ്പൊക്കം, തട്ടിപ്പ് എന്നിവയെക്കുറിച്ച് ചോദിക്കുക.'))}
function ask(q){
  add('me',q);
  if(P.api&&!/^(hey |hi|hello|help|get|start|turn|show|activate)/i.test(q)){
    fetch(P.api,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:q})})
     .then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){reply(String(j.reply||'The server sent no reply.'))})
     .catch(function(){reply('I could not reach your AI backend, so I am using local answers only.');local(q).then(reply)});
  }else local(q).then(reply)
}
$('chatForm').onsubmit=function(e){e.preventDefault();var v=$('chatIn').value.trim();if(v){$('chatIn').value='';ask(v)}};
if(window.speechSynthesis)speechSynthesis.onvoiceschanged=function(){};
add('ai','Hello. I give guidance and shortcuts only. I cannot contact emergency services for you.');

/* ---------- voice ---------- */
var rec=null,on=false;
$('reactor').onclick=function(){
  if(!SPEC){$('heard').textContent='Voice input is not supported in this browser. Type below instead (Chrome works best).';return}
  if(on){rec.stop();return}
  try{rec=new SPEC();rec.lang=P.lang;rec.interimResults=true;rec.continuous=false;
    rec.onstart=function(){on=true;setMode('listening');$('heard').textContent='Listening…'};
    rec.onresult=function(e){var t='';for(var i=e.resultIndex;i<e.results.length;i++)t+=e.results[i][0].transcript;
      $('heard').textContent='“'+t+'”';if(e.results[e.results.length-1].isFinal)ask(t)};
    rec.onerror=function(e){$('heard').textContent=(e.error==='not-allowed'||e.error==='service-not-allowed')?'Microphone blocked. Allow it in the browser site settings, or type instead.':'Voice error: '+e.error+'. You can type instead.'};
    rec.onend=function(){on=false;setMode('')};
    rec.start()}catch(e){$('heard').textContent='Could not start the microphone. Type instead.'}
};

/* ---------- location ---------- */
var pos=null;
function mapsUrl(p){return 'https://www.google.com/maps?q='+p.lat+','+p.lon}
function getLoc(cb){
  if(!navigator.geolocation){toast('Location is not supported here');return}
  toast('Requesting location…');
  navigator.geolocation.getCurrentPosition(function(g){
    pos={lat:g.coords.latitude.toFixed(6),lon:g.coords.longitude.toFixed(6),acc:Math.round(g.coords.accuracy)};
    showLoc();if(cb)cb()},
  function(e){toast(e.code===1?'Location denied. Allow it in browser site settings.':e.code===3?'Location timed out. Try outdoors.':'Location unavailable.')},
  {enableHighAccuracy:true,timeout:15000,maximumAge:0});
}
function showLoc(){$('locCard').hidden=false;$('locTxt').textContent='Lat '+pos.lat+', Lon '+pos.lon+' (about '+pos.acc+' m accuracy)';$('locMap').href=mapsUrl(pos);$('locCard').scrollIntoView()}
$('locBtn').onclick=function(){getLoc()};
$('locCopy').onclick=function(){if(pos)copy(mapsUrl(pos))};
$('locShare').onclick=function(){if(!pos)return;if(navigator.share){navigator.share({title:'My location',text:'My location',url:mapsUrl(pos)}).catch(function(){})}else{copy(mapsUrl(pos));toast('Share not supported. Link copied.')}};

/* ---------- SOS ---------- */
function msgText(){return P.tpl.replace('[LOCATION]',pos?mapsUrl(pos):'(location not shared)')}
function refreshSOS(){
  $('sosMsg').value=msgText();
  var c=P.phone;
  $('sosCall').href=c?'tel:'+c:'#';$('sosSms').href=c?'sms:'+c+'?body='+encodeURIComponent($('sosMsg').value):'#';
  $('sosLoc').textContent=(c?'Contact: '+(P.name||c)+'. ':'No trusted contact set. Add one in Settings. ')+(pos?'Location included.':'Location not included yet.');
  $('sosMap').hidden=!pos;if(pos)$('sosMap').href=mapsUrl(pos);
}
function openSOS(){refreshSOS();$('sosModal').hidden=false}
$('sosBtn').onclick=openSOS;
$('sosCancel').onclick=function(){$('sosModal').hidden=true};
$('sosFetch').onclick=function(){getLoc(refreshSOS)};
$('sosCopy').onclick=function(){copy($('sosMsg').value)};
$('sosMsg').oninput=function(){if(P.phone)$('sosSms').href='sms:'+P.phone+'?body='+encodeURIComponent($('sosMsg').value)};
['sosCall','sosSms'].forEach(function(id){$(id).addEventListener('click',function(e){if(!P.phone){e.preventDefault();toast('Add a trusted contact in Settings first')}})});

/* ---------- timer ---------- */
var tEnd=0,tInt=null;
function fmt(s){s=Math.max(0,s);var m=Math.floor(s/60);return (m<10?'0':'')+m+':'+(s%60<10?'0':'')+(s%60)}
function startTimer(){var m=parseInt($('timerMin').value,10);if(!(m>0)){toast('Enter minutes');return}
  clearInterval(tInt);tEnd=Date.now()+m*60000;tInt=setInterval(tickT,500);tickT();toast('Timer started. Keep this page open.')}
function tickT(){var left=Math.round((tEnd-Date.now())/1000);$('timerOut').textContent=fmt(left);if(left<=0){stopTimer(true);alarm()}}
function stopTimer(keep){clearInterval(tInt);tInt=null;if(!keep)$('timerOut').textContent=fmt((parseInt($('timerMin').value,10)||15)*60)}
function alarm(){$('alarm').hidden=false;$('alCall').href=P.phone?'tel:'+P.phone:'#';
  if(navigator.vibrate)navigator.vibrate([500,200,500,200,500]);
  if(P.sound)beep()}
var ac=null;
function beep(){try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();var n=0;(function b(){if($('alarm').hidden||n++>20)return;
  var o=ac.createOscillator(),g=ac.createGain();o.frequency.value=880;g.gain.value=.2;o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+.25);setTimeout(b,700)})()}catch(e){}}
$('tStart').onclick=startTimer;$('tStop').onclick=function(){stopTimer()};
$('timerMin').onchange=function(){if(!tInt)stopTimer()};
$('safeBtn').onclick=function(){$('alarm').hidden=true;stopTimer();toast('Marked safe')};
$('alSos').onclick=function(){$('alarm').hidden=true;openSOS()};

/* ---------- flashlight ---------- */
var fStream=null,fOn=false;
function flashlight(){
  if(fOn){fStream.getTracks().forEach(function(t){t.stop()});fStream=null;fOn=false;$('flashBtn').querySelector('small').textContent='Off';toast('Flashlight off');return}
  var md=navigator.mediaDevices;
  if(!md||!md.getUserMedia){noFlash();return}
  md.getUserMedia({video:{facingMode:'environment'}}).then(function(s){
    var t=s.getVideoTracks()[0],caps=t.getCapabilities?t.getCapabilities():{};
    if(!caps.torch){s.getTracks().forEach(function(x){x.stop()});noFlash();return}
    return t.applyConstraints({advanced:[{torch:true}]}).then(function(){fStream=s;fOn=true;$('flashBtn').querySelector('small').textContent='On (tap to turn off)';toast('Flashlight on')})
  }).catch(function(){noFlash()});
}
function noFlash(){alert('This browser cannot control the flashlight.\n\nUse your phone instead: swipe down from the top of the screen and tap the Torch or Flashlight icon.')}
$('flashBtn').onclick=flashlight;

applyPrefs();$('timerOut').textContent=fmt((parseInt($('timerMin').value,10)||15)*60);
if('serviceWorker' in navigator&&location.protocol!=='file:'){navigator.serviceWorker.register('sw.js').catch(function(){})}
})();
