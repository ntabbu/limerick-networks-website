/* Limerick Network — shared behaviour: header menus, enquiry forms, logo strip */
(function(){
/* EDIT: paste your form service URL (e.g. a Formspree endpoint) between the quotes to receive enquiries. */
var FORM_ENDPOINT="";
var $=function(id){return document.getElementById(id)};

/* ---- header: burger + dropdowns ---- */
var nav=$("lkx-nav"),burger=$("lkx-burger");
function closeDD(except){document.querySelectorAll(".lkx-dd.open").forEach(function(d){if(d!==except){d.classList.remove("open");d.firstElementChild.setAttribute("aria-expanded","false")}})}
if(burger&&nav){burger.addEventListener("click",function(){var o=nav.classList.toggle("open");burger.setAttribute("aria-expanded",o)})}
document.querySelectorAll(".lkx-dd>button").forEach(function(b){b.addEventListener("click",function(e){e.stopPropagation();var d=b.parentElement,o=!d.classList.contains("open");closeDD(d);d.classList.toggle("open",o);b.setAttribute("aria-expanded",o)})});
document.addEventListener("click",function(e){if(!e.target.closest(".lkx-dd"))closeDD()});
document.addEventListener("keydown",function(e){if(e.key==="Escape"){closeDD();if(nav)nav.classList.remove("open")}});
if(nav)nav.querySelectorAll("a").forEach(function(a){a.addEventListener("click",function(){nav.classList.remove("open");closeDD()})});

/* ---- logo strip: duplicate for seamless loop ---- */
var marq=$("lkx-marq");
if(marq){Array.prototype.slice.call(marq.children).forEach(function(li){var c=li.cloneNode(true);c.setAttribute("aria-hidden","true");var im=c.querySelector("img");if(im)im.alt="";marq.appendChild(c)});
marq.querySelectorAll("img").forEach(function(img){img.addEventListener("error",function(){var li=img.parentNode,t=img.getAttribute("alt")||"";img.remove();li.textContent=t})})}

/* ---- enquiry forms ---- */
document.querySelectorAll("form[data-lkx-form]").forEach(function(form){
var q=function(n){return form.querySelector('[name="'+n+'"]')};
var st=form.querySelector(".lkx-status"),btn=form.querySelector('button[type="submit"]');
function err(n,m){var f=q(n),e=form.querySelector('[data-err="'+n+'"]');if(e)e.textContent=m||"";if(f){if(m)f.setAttribute("aria-invalid","true");else f.removeAttribute("aria-invalid")}return !m}
function validate(){
var name=q("name").value.trim(),mob=q("mobile").value.replace(/[\s\-()]/g,"").replace(/^(\+?91|0)(?=\d{10}$)/,""),email=q("email").value.trim(),loc=q("location").value.trim(),ok=true,first=null;
function chk(n,m){if(!err(n,m)){ok=false;if(!first)first=q(n)}}
chk("name",name.length<2?"Please enter your full name.":"");
chk("mobile",/^[6-9]\d{9}$/.test(mob)?"":"Please enter a valid 10-digit mobile number.");
chk("email",email&&!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)?"Please enter a valid email address.":"");
chk("location",loc.length<2?"Please enter your area or city.":"");
chk("service",q("service").value?"":"Please select a service.");
chk("consent",q("consent").checked?"":"Please tick the box so we can contact you.");
if(first)first.focus();return ok}
function show(t,h){st.className="lkx-status "+t;st.innerHTML=h}
form.addEventListener("submit",function(e){
e.preventDefault();st.className="lkx-status";st.innerHTML="";
if(q("company_website").value)return;
if(!validate())return;
if(!FORM_ENDPOINT){var WA_NUMBER="919175884641";var gv=function(n){var e=form.querySelector('[name="'+n+'"]');return e&&e.value?e.value.trim():""};var lines=["*New Enquiry - Limerick Network*","Name: "+gv("name"),"Mobile: "+gv("mobile")];if(gv("email"))lines.push("Email: "+gv("email"));lines.push("Location: "+gv("location"),"Service: "+gv("service"));if(gv("message"))lines.push("Message: "+gv("message"));var url="https://wa.me/"+WA_NUMBER+"?text="+encodeURIComponent(lines.join("\n"));var w=window.open(url,"_blank");if(w){try{w.opener=null}catch(x){}}else{window.location.href=url}show("ok","Opening WhatsApp... please press <b>Send</b> there so your enquiry reaches our team. <a href=\""+url+"\" target=\"_blank\" rel=\"noopener\">Open WhatsApp again</a>.");form.reset();return}
btn.disabled=true;var old=btn.textContent;btn.textContent="Sending...";
fetch(FORM_ENDPOINT,{method:"POST",body:new FormData(form),headers:{Accept:"application/json"}}).then(function(r){
if(r.ok){show("ok","Thank you! We've received your enquiry and will contact you shortly.");form.reset()}else{throw new Error("HTTP "+r.status)}
}).catch(function(){show("bad","Sorry, something went wrong and your enquiry was not sent. Please try again, or call <a href=\"tel:+912048504814\">020-48504814</a> or email <a href=\"mailto:info@limerick.co.in\">info@limerick.co.in</a>.")}).then(function(){btn.disabled=false;btn.textContent=old})});
["name","mobile","email","location","service","consent"].forEach(function(n){var el=q(n);if(!el)return;el.addEventListener("input",function(){err(n,"")});el.addEventListener("change",function(){err(n,"")})});
});

/* ---- ?service=… preselect on pages with a form ---- */
var yr=$("lkx-yr");if(yr)yr.textContent=new Date().getFullYear();
})();
