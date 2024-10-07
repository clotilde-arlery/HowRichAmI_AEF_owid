var annuel_radio = document.getElementById("annuel");
var mensuel_radio = document.getElementById("mensuel");
var annuel_label = document.getElementById("annuel_label");
var mensuel_label = document.getElementById("mensuel_label");
var income_period = document.getElementById("income_period");
var container_dropdownperiod = document.getElementById("container_dropdownperiod");
let initialForm = document.getElementById('initialForm');
let launchButton = document.getElementById('calculer');
let containerApp = document.getElementById('containerApp');
let yearlyIncome;
let preTaxSlider = document.getElementById("preTaxSlider");
let postTaxSlider = document.getElementById("postTaxSlider");
let range_input = document.getElementById("range_input");
let txt_postTaxDonation = document.getElementById("txt_postTaxDonation");
let txt_preTaxDonation = document.getElementById("txt_preTaxDonation");

const CPI_FR_2017 = 106.864453008147;
const CPI_FR_2022 = 118.258283622798;
const PPP_CONV_FAC_FR_2017 = 0.847836;
let income_usd_2017;

launchButton.addEventListener('click', App);
initialForm.addEventListener('input', checkLaunchButton);
document.addEventListener('keydown', launchIfEnterKeyIsPressed);
range_input.addEventListener('input', App);
document.onreadystatechange = event => reloadAppOnPageRestoredFromCache(event);

preTaxSlider.value = 10;

/* Init form */
let revenu = document.getElementById('income');
let nb_adult = document.getElementById('nb_adult');
let nb_children= document.getElementById('nb_children');

/* Form on change */
function formValid(){
    return revenu.value != 0 && (nb_adult.value === "" || nb_adult.value != 0);
}

function checkLaunchButton(){
    if (!formValid()){
        launchButton.setAttribute("disabled", "");
    }
    else{
        launchButton.removeAttribute("disabled");
    }
}

function launchIfEnterKeyIsPressed(event){
    if (event.key != "Enter"){
        return;
    }

    if (formValid() && event.target.localName == "input"){
        event.target.blur(); // unfocus text field to hide keyboard on mobile
    }

    App(event);
}


if (annuel_radio.checked == true){
    income_period.innerHTML = "annuel";
    } 
    else{
        income_period.innerHTML = "mensuel";
    }

function checkIncomePeriod(){
    if (annuel_radio.checked == true){
        income_period.innerHTML = "annuel";
        income_period.style.transition = "0.2s";
    } 
    else{
        income_period.innerHTML = "mensuel";
        income_period.style.transition = "0.2s";
    }
}

document.getElementById("containerHRAI").addEventListener("change", onChangeReload);
window.addEventListener('resize', App);


function onChangeReload() {
    checkIncomePeriod();
    checkLaunchButton();
    //App();
}

function toggleDropdown() {
  document.getElementById("income_period_dropdown").classList.toggle("show");
}

function reloadAppOnPageRestoredFromCache(event) { 
    if (document.readyState == "complete") {
        checkLaunchButton();
        App(event);
    }
}


function enableSmoothScrolling() {
    document.querySelector("html").style.scrollBehavior = "smooth";
}
function disableSmoothScrolling() {
    document.querySelector("html").style.scrollBehavior = "auto";
}


// Close the dropdown if the user clicks outside of it
container_dropdownperiod.addEventListener("click", toggleDropdown);
annuel_label.addEventListener("click", toggleDropdown);
mensuel_label.addEventListener("click", toggleDropdown);

/* Collapsable footnote section */
var notesSection = document.querySelector("section#notes");

function toggleCollapseNotes() {
    notesSection.toggleAttribute("collapsed");
}

function collapseNotes() {
    notesSection.setAttribute("collapsed", "");
}

function expandNotes() {
    notesSection.removeAttribute("collapsed");
}

function collapseNotesIfNotInView() {
    windowBottom = window.scrollY + window.innerHeight;
    notesIsNotInView = windowBottom < notesSection.offsetTop;
    if (notesIsNotInView){
        collapseNotes();
    }
}

// Event listeners for notes section
var toggleNotesButton = document.querySelector("button#toggleNotes");
toggleNotesButton.addEventListener("click", toggleCollapseNotes);

document.addEventListener('scroll', collapseNotesIfNotInView);

footnoteLinks = document.querySelectorAll("a.footNote");
for(i in footnoteLinks) {
    footnoteLinks[i].addEventListener('click', expandNotes);
}


/* App secundary functions */
function formatNumber(x, roundToUnit=false){
    if (roundToUnit){
        x = Math.round(x);
    } else {
        // Round to at most 1 decimal place (12.07 -> 12.1, and 12.02 -> 12)
        x = Math.round(x * 10) / 10;
    }
    
    // Use French number formatting
    x = x.toLocaleString('fr');

    return x;
}


function getNParts(n_adults, n_children){
    let nParts;
    if (n_adults == 1){
        if (n_children == 0){
            nParts = 1;
        }
        else if (n_children == 1){
            nParts = 1.5;
        }
        else if (n_children >= 2){
            nParts = n_children;
        }     
    }
    else if (n_adults >= 2){
        n_children_over_14 = n_adults - 2;
        n_children_all_ages = n_children + n_children_over_14;
        if (n_children_all_ages == 0){
            nParts = 2;
        }
        else if (n_children_all_ages == 1){
            nParts = 2.5;
        }
        else if (n_children_all_ages >= 2){
            nParts = n_children_all_ages + 1;
        }
    }
    return nParts;
}


function getTax(income, nParts){
    let tax;
    let quotientFamilial = income / nParts;

    if (quotientFamilial <= 10777){
            tax = 0;
        }
        else if (quotientFamilial >= 10778 && quotientFamilial <= 27478){
            tax = ((quotientFamilial - 10778) * 0.11) * nParts;
        }
        else if (quotientFamilial >= 27479 && quotientFamilial <= 78570){
            tax = (16700 * 0.11 + (quotientFamilial - 27479) * 0.3) * nParts;
        }
        else if (quotientFamilial >= 78571 && quotientFamilial <= 168994){
            tax = (16700*0.11 + 51091*0.3 + (quotientFamilial - 78571)*0.41)
                  * nParts;
        }
        else if (quotientFamilial > 168994){
            tax = (16700 * 0.11 + 51091 * 0.3 + 90423 * 0.41
                   + (quotientFamilial - 168994) * 0.45)
                  * nParts;
        }
    return tax;
}


function getDeductibleAmount(income, donationPreTax, nParts){
    let tax = getTax(income, nParts);
    let eligibilityCap = 0.20 * income;
    let deductionRate = 0.66;

    let elligibleAmount = Math.min(donationPreTax, eligibilityCap);
    let deductibleAmount = Math.min(elligibleAmount * deductionRate, tax);
    
    console.log("Income tax: ", tax);
    console.log("Deductible amount: ", deductibleAmount);
    return deductibleAmount;
}


function getDonationPostTax(income, donationPreTax, nParts){
    let deductibleAmount = getDeductibleAmount(income, donationPreTax, nParts);
    let donationPostTax = donationPreTax - deductibleAmount;
    
    console.log("Post tax donation : ", donationPostTax);
    return donationPostTax;
}


function getDonationPreTax(income, donationPostTax, nParts){
    let tax = getTax(income, nParts);
    let eligibilityCap = 0.20 * income;
    let deductionRate = 0.66;
    let multiplier = 1 / (1 - deductionRate);

    let multipliablePart = Math.min(donationPostTax,
                                    eligibilityCap / multiplier);
    let multipliedDonation = multipliablePart * multiplier;
    let maximumDeduction = multipliedDonation * deductionRate;
    let deduction = Math.min(maximumDeduction, tax);

    let donationPreTax = donationPostTax + deduction;
    return donationPreTax;
}


function getPercentile(income){
    for (var i = 0; i < global_income_distrib_owid.length; i++){
        // thresholds represents daily incomes in international 2017 dollars. That's why we multiply by 365 
            if (income < global_income_distrib_owid[i]['threshold']*365){
                percentile = i;
                break;
            }
            else {
                percentile = 99.9;
            }
        }
    return percentile;
}


/* Main App function */
function App(triggeringEvent){
    if (!formValid()) return;

    let equivalent_size, percentile, pourcentage_position, ajusted_income;
    let txt_period = document.getElementById('txt_period');
    let txt_pourN = document.getElementById('txt_pourN');
    let txt_revenu = document.getElementById('txt_revenu');
    let txt_nbMenage = document.getElementById('txt_nbMenage');
    let positionPercentSpans = document.querySelectorAll('span.positionPercent');
    let individual_income_position;

    let inputIsPostTax;
    if (triggeringEvent.type != "input"){
        inputIsPostTax = false;
    } 
    else {
        let inputName = triggeringEvent.srcElement.name;
        inputIsPostTax = (inputName == "postTaxSlider");
    }

    
    // Display results
    containerApp.style.display = "block";
    
    // Scroll smoothly to top of first section if form was submitted
    if (triggeringEvent.type == "click" || triggeringEvent.type == "keydown"){
        enableSmoothScrolling();
        window.scrollTo(0, document.querySelector("#userSituation").offsetTop);
        disableSmoothScrolling();
    }

    // Use placeholder default values if "Adultes" and "Enfants" are empty
    if (nb_adult.value === ""){
        nb_adult.value = 1;
    }
    if (nb_children.value === ""){
        nb_children.value = 0;
    }


    txt_revenu.innerHTML = formatNumber(revenu.value) + '€';
    if (annuel_radio.checked){
        yearlyIncome = revenu.value;
        txt_period.innerHTML = "an";
    }
    else {
        yearlyIncome = revenu.value * 12;
        txt_period.innerHTML = "mois";
    }
    //console.log(income);

    n_adults = Number(nb_adult.value);
    n_children = Number(nb_children.value);
    n_household = n_adults + n_children;
    txt_nbMenage.innerHTML = n_household;
    if (n_household == 1){
        txt_pourN.style.display = "none";
    } else {
        txt_pourN.style.display = "inline";
    }

    if (n_adults == 1){
        equivalent_size = n_adults + 0.3 * n_children;
    }
    else if (n_adults > 1){
        equivalent_size = (n_adults - 1) * 0.5 + 1 + 0.3 * (n_children);
    }
    ajusted_income = yearlyIncome / equivalent_size;

    income_usd_2017 = (ajusted_income/PPP_CONV_FAC_FR_2017)*(CPI_FR_2017/CPI_FR_2022);
    
    percentile = getPercentile(income_usd_2017);
    //console.log(percentile);
    pourcentage_position = 100 - percentile;
    console.log("pourcentage position : ", pourcentage_position);

    let percentString = formatNumber(pourcentage_position) + "%";
    for (i in positionPercentSpans) {
        positionPercentSpans[i].innerHTML = percentString;
    }
    let graph_container = document.getElementById('graph_container');
    let income_position_bar = document.getElementById('income_position_bar');
    let graph_width = graph_container.clientWidth;
    let poorer_graph_width = document.getElementById('poorer_position');
    income_position_bar.style.width = (pourcentage_position).toString()+"%";
    poorer_graph_width.style.width = (100 - pourcentage_position).toString()+"%"; 
    //console.log("taille de la barre perso : ", income_position_bar.style.width);
    
    let revenuMedian = 6499.6;
    
    let timesRevenuMedian = ajusted_income/revenuMedian;
    document.getElementById("timesRevenuMedian").innerHTML =
        formatNumber(timesRevenuMedian) + " fois ";
/* global_income_distrib_owid[9]["threshold"] à réécrire */
    let times10poorest = income_usd_2017 / (global_income_distrib_owid[9]["threshold"]*365);
    document.getElementById("times10poorest").innerHTML =
        formatNumber(times10poorest, roundToUnit=true) + " fois ";
    
    let compare_barPoor = document.getElementById("compare_barPoor");
    let compare_barMedian = document.getElementById("compare_barMedian");
    let compare_barYou = document.getElementById("compare_barYou");
    compare_barYou_width = compare_barYou.clientWidth;
    //console.log(compare_barYou_width);
    compare_barMedian.style.width = (compare_barYou_width/timesRevenuMedian).toString() + "px";
    compare_barPoor.style.width = (compare_barYou_width/times10poorest).toString() + "px";

    let nParts = getNParts(n_adults, n_children);
    console.log("Nombre de parts : ", nParts);

    // Get slider input
    let donationPreTax, donationPostTax;
    let donationPreTaxPercent, donationPostTaxPercent;
    if (inputIsPostTax){
        donationPostTaxPercent = postTaxSlider.value;
        donationPostTax = (donationPostTaxPercent / 100) * yearlyIncome;
        
        donationPreTax = getDonationPreTax(yearlyIncome, donationPostTax, nParts);
        donationPreTaxPercent = (donationPreTax / yearlyIncome) * 100;
    
        preTaxSlider.value = donationPreTaxPercent;
    }
    else {
        donationPreTaxPercent = preTaxSlider.value;
        donationPreTax = (donationPreTaxPercent / 100) * yearlyIncome;
        
        donationPostTax = getDonationPostTax(yearlyIncome, donationPreTax, nParts);
        donationPostTaxPercent = (donationPostTax / yearlyIncome) * 100;

        postTaxSlider.value = donationPostTaxPercent;
    }
    
    // Prevent pre-tax donation from going over 50%
    if (donationPreTaxPercent > 50){
        donationPreTaxPercent = 50;
        donationPreTax = (donationPreTaxPercent / 100) * yearlyIncome;

        donationPostTax = getDonationPostTax(yearlyIncome, donationPreTax, nParts);
        donationPostTaxPercent = (donationPostTax / yearlyIncome) * 100;

        postTaxSlider.value = donationPostTaxPercent;
    }

    // Update slider background color
    console.log(postTaxSlider.value + "%");
    postTaxSlider.style.setProperty("--color-change-point-1",
                                   postTaxSlider.value * 2 + "%");
    postTaxSlider.style.setProperty("--color-change-point-2",
                                   preTaxSlider.value * 2 + "%");

    // Update text above slider
    txt_postTaxDonation.innerHTML = formatNumber(donationPreTaxPercent) + "%";
    txt_preTaxDonation.innerHTML = formatNumber(donationPostTaxPercent) + "%";

    let incomePostDon = yearlyIncome - donationPostTax;
    let ajusted_incomePD = incomePostDon/equivalent_size;
    let income_usd_2017PD = (ajusted_incomePD/PPP_CONV_FAC_FR_2017)*(CPI_FR_2017/CPI_FR_2022);
    let percentilePostDon = getPercentile(ajusted_incomePD);
    let positionPostDon = document.getElementById("positionPostDon");
    let pourcentage_positionPD = 100 - percentilePostDon;
    positionPostDon.innerHTML = formatNumber(pourcentage_positionPD) + "%";

    let graph_containerPD = document.getElementById('graph_containerPD');
    let income_position_barPD = document.getElementById('income_position_barPD');
    let graph_widthPD = graph_containerPD.clientWidth;
    income_position_barPD.style.width = ((1 - percentilePostDon/100)*graph_widthPD).toString()+"px";

    let txt_amountDon = document.getElementById("txt_amountDon");
    let txt_amountDonDefisc = document.getElementById("txt_amountDonDefisc");
    txt_amountDon.innerHTML = 
        formatNumber(donationPreTax, roundToUnit=true) + "€";
    txt_amountDonDefisc.innerHTML =
        formatNumber(donationPostTax, roundToUnit=true) + "€";
    
    let prixUnitaire_moustiquaire = 4.49; // cout d'une moustiquaire en euros
    let moustiquaire_vieSauvee = 6327.59; // coût moyen par vie sauvée
    let Unitaire_vieEnCage = 0.11; // cout pour une année de vie en cage évitée
    let Unitaire_CO2 = 10; //cout d'une tonne évitée en euros;
    let emissionMoy_fce = 4.46; //emission moyenne d'un francais en tonnes 

    let don_moustiquaire = donationPreTax/prixUnitaire_moustiquaire ; // nombre de moustiquaires pouvant être financer
    let don_vieSauvee = donationPreTax/moustiquaire_vieSauvee; // nombre de vie sauvée
    let don_vieEnCage = donationPreTax/Unitaire_vieEnCage; // nombre d'années de vie en cage évitées
    let don_CO2 = donationPreTax/Unitaire_CO2; // nombre de tonnes évitées
    let don_emissionMoy_fce = don_CO2/emissionMoy_fce; 

    
    let txt_prixUnitaire_moustiquaire = document.getElementById("txt_prixUnitaire_moustiquaire");
    let txt_moustiquaire_vieSauvee = document.getElementById("txt_moustiquaire_vieSauvee");
    let txt_Unitaire_vieEnCage = document.getElementById("txt_Unitaire_vieEnCage");
    let txt_Unitaire_CO2 = document.getElementById("txt_Unitaire_CO2");
    let txt_emissionMoy_fce = document.getElementById("txt_emissionMoy_fce");

    console.log(don_moustiquaire);
    console.log(formatNumber(don_moustiquaire, roundToUnit=true));
    txt_prixUnitaire_moustiquaire.innerHTML = formatNumber(don_moustiquaire, roundToUnit=true);
    txt_moustiquaire_vieSauvee.innerHTML = formatNumber(don_vieSauvee);
    txt_Unitaire_vieEnCage.innerHTML = formatNumber(don_vieEnCage, roundToUnit=true);
    txt_Unitaire_CO2.innerHTML = formatNumber(don_CO2, roundToUnit=true);
    txt_emissionMoy_fce.innerHTML = formatNumber(don_emissionMoy_fce, roundToUnit=true);

    let privilegie;
    if (percentile < 70){
        privilegie = false;
    }
    else{
        privilegie = true;
    }
    let txt_privilegie = document.getElementById("txt_privilegie");
    if (privilegie == false){
        txt_privilegie.style.display = "none";
    }
    else{
        txt_privilegie.style.display = "block";
    }
}


