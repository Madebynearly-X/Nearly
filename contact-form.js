(() => {
  "use strict";

  const form = document.querySelector("[data-form]");
  if (!form) return;

  const phone = form.querySelector("#q-phone");
  if (phone) {
    const countryCodes = [
      ["Afghanistan", "+93"], ["Albania", "+355"], ["Algeria", "+213"], ["American Samoa", "+1"],
      ["Andorra", "+376"], ["Angola", "+244"], ["Anguilla", "+1"], ["Antigua and Barbuda", "+1"],
      ["Argentina", "+54"], ["Armenia", "+374"], ["Aruba", "+297"], ["Australia", "+61"],
      ["Austria", "+43"], ["Azerbaijan", "+994"], ["Bahamas", "+1"], ["Bahrain", "+973"],
      ["Bangladesh", "+880"], ["Barbados", "+1"], ["Belarus", "+375"], ["Belgium", "+32"],
      ["Belize", "+501"], ["Benin", "+229"], ["Bermuda", "+1"], ["Bhutan", "+975"],
      ["Bolivia", "+591"], ["Bosnia and Herzegovina", "+387"], ["Botswana", "+267"], ["Brazil", "+55"],
      ["British Virgin Islands", "+1"], ["Brunei", "+673"], ["Bulgaria", "+359"], ["Burkina Faso", "+226"],
      ["Burundi", "+257"], ["Cambodia", "+855"], ["Cameroon", "+237"], ["Canada", "+1"],
      ["Cape Verde", "+238"], ["Cayman Islands", "+1"], ["Central African Republic", "+236"], ["Chad", "+235"],
      ["Chile", "+56"], ["China", "+86"], ["Colombia", "+57"], ["Comoros", "+269"],
      ["Congo", "+242"], ["Cook Islands", "+682"], ["Costa Rica", "+506"], ["Cote d'Ivoire", "+225"],
      ["Croatia", "+385"], ["Cuba", "+53"], ["Curacao", "+599"], ["Cyprus", "+357"],
      ["Czechia", "+420"], ["Democratic Republic of the Congo", "+243"], ["Denmark", "+45"], ["Djibouti", "+253"],
      ["Dominica", "+1"], ["Dominican Republic", "+1"], ["Ecuador", "+593"], ["Egypt", "+20"],
      ["El Salvador", "+503"], ["Equatorial Guinea", "+240"], ["Eritrea", "+291"], ["Estonia", "+372"],
      ["Eswatini", "+268"], ["Ethiopia", "+251"], ["Falkland Islands", "+500"], ["Faroe Islands", "+298"],
      ["Fiji", "+679"], ["Finland", "+358"], ["France", "+33"], ["French Guiana", "+594"],
      ["French Polynesia", "+689"], ["Gabon", "+241"], ["Gambia", "+220"], ["Georgia", "+995"],
      ["Germany", "+49"], ["Ghana", "+233"], ["Gibraltar", "+350"], ["Greece", "+30"],
      ["Greenland", "+299"], ["Grenada", "+1"], ["Guadeloupe", "+590"], ["Guam", "+1"],
      ["Guatemala", "+502"], ["Guernsey", "+44"], ["Guinea", "+224"], ["Guinea-Bissau", "+245"],
      ["Guyana", "+592"], ["Haiti", "+509"], ["Honduras", "+504"], ["Hong Kong", "+852"],
      ["Hungary", "+36"], ["Iceland", "+354"], ["India", "+91"], ["Indonesia", "+62"],
      ["Iran", "+98"], ["Iraq", "+964"], ["Ireland", "+353"], ["Isle of Man", "+44"],
      ["Israel", "+972"], ["Italy", "+39"], ["Jamaica", "+1"], ["Japan", "+81"],
      ["Jersey", "+44"], ["Jordan", "+962"], ["Kazakhstan", "+7"], ["Kenya", "+254"],
      ["Kiribati", "+686"], ["Kosovo", "+383"], ["Kuwait", "+965"], ["Kyrgyzstan", "+996"],
      ["Laos", "+856"], ["Latvia", "+371"], ["Lebanon", "+961"], ["Lesotho", "+266"],
      ["Liberia", "+231"], ["Libya", "+218"], ["Liechtenstein", "+423"], ["Lithuania", "+370"],
      ["Luxembourg", "+352"], ["Macau", "+853"], ["Madagascar", "+261"], ["Malawi", "+265"],
      ["Malaysia", "+60"], ["Maldives", "+960"], ["Mali", "+223"], ["Malta", "+356"],
      ["Marshall Islands", "+692"], ["Martinique", "+596"], ["Mauritania", "+222"], ["Mauritius", "+230"],
      ["Mayotte", "+262"], ["Mexico", "+52"], ["Micronesia", "+691"], ["Moldova", "+373"],
      ["Monaco", "+377"], ["Mongolia", "+976"], ["Montenegro", "+382"], ["Montserrat", "+1"],
      ["Morocco", "+212"], ["Mozambique", "+258"], ["Myanmar", "+95"], ["Namibia", "+264"],
      ["Nauru", "+674"], ["Nepal", "+977"], ["Netherlands", "+31"], ["New Caledonia", "+687"],
      ["New Zealand", "+64"], ["Nicaragua", "+505"], ["Niger", "+227"], ["Nigeria", "+234"],
      ["Niue", "+683"], ["North Korea", "+850"], ["North Macedonia", "+389"], ["Northern Mariana Islands", "+1"],
      ["Norway", "+47"], ["Oman", "+968"], ["Pakistan", "+92"], ["Palau", "+680"],
      ["Palestine", "+970"], ["Panama", "+507"], ["Papua New Guinea", "+675"], ["Paraguay", "+595"],
      ["Peru", "+51"], ["Philippines", "+63"], ["Poland", "+48"], ["Portugal", "+351"],
      ["Puerto Rico", "+1"], ["Qatar", "+974"], ["Reunion", "+262"], ["Romania", "+40"],
      ["Russia", "+7"], ["Rwanda", "+250"], ["Saint Barthelemy", "+590"], ["Saint Helena", "+290"],
      ["Saint Kitts and Nevis", "+1"], ["Saint Lucia", "+1"], ["Saint Martin", "+590"], ["Saint Pierre and Miquelon", "+508"],
      ["Saint Vincent and the Grenadines", "+1"], ["Samoa", "+685"], ["San Marino", "+378"], ["Sao Tome and Principe", "+239"],
      ["Saudi Arabia", "+966"], ["Senegal", "+221"], ["Serbia", "+381"], ["Seychelles", "+248"],
      ["Sierra Leone", "+232"], ["Singapore", "+65"], ["Sint Maarten", "+1"], ["Slovakia", "+421"],
      ["Slovenia", "+386"], ["Solomon Islands", "+677"], ["Somalia", "+252"], ["South Africa", "+27"],
      ["South Korea", "+82"], ["South Sudan", "+211"], ["Spain", "+34"], ["Sri Lanka", "+94"],
      ["Sudan", "+249"], ["Suriname", "+597"], ["Sweden", "+46"], ["Switzerland", "+41"],
      ["Syria", "+963"], ["Taiwan", "+886"], ["Tajikistan", "+992"], ["Tanzania", "+255"],
      ["Thailand", "+66"], ["Timor-Leste", "+670"], ["Togo", "+228"], ["Tokelau", "+690"],
      ["Tonga", "+676"], ["Trinidad and Tobago", "+1"], ["Tunisia", "+216"], ["Turkey", "+90"],
      ["Turkmenistan", "+993"], ["Turks and Caicos Islands", "+1"], ["Tuvalu", "+688"], ["Uganda", "+256"],
      ["Ukraine", "+380"], ["United Arab Emirates", "+971"], ["United Kingdom", "+44"], ["United States", "+1"],
      ["Uruguay", "+598"], ["US Virgin Islands", "+1"], ["Uzbekistan", "+998"], ["Vanuatu", "+678"],
      ["Vatican City", "+39"], ["Venezuela", "+58"], ["Vietnam", "+84"], ["Wallis and Futuna", "+681"],
      ["Western Sahara", "+212"], ["Yemen", "+967"], ["Zambia", "+260"], ["Zimbabwe", "+263"],
    ];
    const countryFlagCodes = "AF AL DZ AS AD AO AI AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM BT BO BA BW BR VG BN BG BF BI KH CM CA CV KY CF TD CL CN CO KM CG CK CR CI HR CU CW CY CZ CD DK DJ DM DO EC EG SV GQ ER EE SZ ET FK FO FJ FI FR GF PF GA GM GE DE GH GI GR GL GD GP GU GT GG GN GW GY HT HN HK HU IS IN ID IR IQ IE IM IL IT JM JP JE JO KZ KE KI XK KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MQ MR MU YT MX FM MD MC MN ME MS MA MZ MM NA NR NP NL NC NZ NI NE NG NU KP MK MP NO OM PK PW PS PA PG PY PE PH PL PT PR QA RE RO RU RW BL SH KN LC MF PM VC WS SM ST SA SN RS SC SL SG SX SK SI SB SO ZA KR SS ES LK SD SR SE CH SY TW TJ TZ TH TL TG TK TO TT TN TR TM TC TV UG UA AE GB US UY VI UZ VU VA VE VN WF EH YE ZM ZW".split(" ");
    const countryCode = document.createElement("input");
    const countryPicker = document.createElement("div");
    const countryTrigger = document.createElement("button");
    const countryPopover = document.createElement("div");
    const countrySearch = document.createElement("input");
    const countryOptions = document.createElement("div");
    const phoneGroup = document.createElement("div");

    countryCode.id = "q-country-code";
    countryCode.name = "country_code";
    countryCode.type = "hidden";
    countryCode.value = "+27";
    countryCode.defaultValue = "+27";
    countryPicker.className = "country-picker";
    countryTrigger.type = "button";
    countryTrigger.className = "country-picker__trigger";
    countryTrigger.setAttribute("aria-label", "Country calling code");
    countryTrigger.setAttribute("aria-haspopup", "dialog");
    countryTrigger.setAttribute("aria-expanded", "false");
    countryTrigger.setAttribute("aria-controls", "q-country-picker-popover");
    countryPopover.className = "country-picker__popover";
    countryPopover.id = "q-country-picker-popover";
    countryPopover.setAttribute("role", "dialog");
    countryPopover.setAttribute("aria-label", "Choose a country calling code");
    countryPopover.hidden = true;
    countrySearch.type = "search";
    countrySearch.className = "country-picker__search";
    countrySearch.placeholder = "Search countries";
    countrySearch.setAttribute("aria-label", "Search countries by name or calling code");
    countrySearch.setAttribute("aria-autocomplete", "list");
    countrySearch.setAttribute("aria-controls", "q-country-list");
    countryOptions.id = "q-country-list";
    countryOptions.className = "country-picker__options";
    countryOptions.setAttribute("role", "listbox");
    countryOptions.setAttribute("aria-label", "Countries and calling codes");

    const countryOptionElements = [];
    countryCodes.forEach(([country, code], index) => {
      const countryCodeISO = countryFlagCodes[index].toLowerCase();
      const flagSequence = Array.from(countryFlagCodes[index], (letter) =>
        (127397 + letter.charCodeAt(0)).toString(16),
      ).join("-");
      const option = document.createElement("button");
      const flag = document.createElement("img");
      const label = document.createElement("span");

      option.type = "button";
      option.className = "country-picker__option";
      option.setAttribute("role", "option");
      option.tabIndex = -1;
      option.setAttribute("aria-selected", String(country === "South Africa"));
      option.dataset.country = country.toLowerCase();
      option.dataset.code = code;
      option.dataset.iso = countryCodeISO;
      flag.className = "country-picker__flag";
      flag.src = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${flagSequence}.svg`;
      flag.alt = "";
      flag.width = 24;
      flag.height = 18;
      label.textContent = `${code} ${country}`;
      option.append(flag, label);
      option.addEventListener("click", () => {
        countryCode.value = code;
        countryOptions.querySelectorAll('[role="option"]').forEach((item) => {
          item.setAttribute("aria-selected", String(item === option));
        });
        updateCountryTrigger(countryFlagCodes[index], code, country);
        closeCountryPicker();
        countryTrigger.focus();
      });
      countryOptions.append(option);
      countryOptionElements.push(option);
    });

    function updateCountryTrigger(iso, code, country) {
      const flag = document.createElement("img");
      const flagSequence = Array.from(iso, (letter) =>
        (127397 + letter.charCodeAt(0)).toString(16),
      ).join("-");
      flag.className = "country-picker__flag";
      flag.src = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${flagSequence}.svg`;
      flag.alt = "";
      flag.width = 24;
      flag.height = 18;
      countryTrigger.replaceChildren(flag, document.createTextNode(`${code} ${country}`));
      countryTrigger.setAttribute("aria-label", `${country}, ${code}`);
    }

    function closeCountryPicker() {
      countryPopover.hidden = true;
      countryTrigger.setAttribute("aria-expanded", "false");
    }

    function openCountryPicker() {
      countryPopover.hidden = false;
      countryTrigger.setAttribute("aria-expanded", "true");
      countrySearch.value = "";
      countryOptions.scrollTop = 0;
      countryOptionElements.forEach((option) => { option.hidden = false; });
      countrySearch.focus();
    }

    countrySearch.addEventListener("input", () => {
      const query = countrySearch.value.trim().toLowerCase();
      countryOptionElements.forEach((option) => {
        option.hidden = !`${option.dataset.country} ${option.dataset.code}`.includes(query);
      });
    });
    countrySearch.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeCountryPicker();
        countryTrigger.focus();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        countryOptionElements.find((option) => !option.hidden)?.focus();
      } else if (event.key === "Tab") {
        closeCountryPicker();
      }
    });
    countryOptions.addEventListener("keydown", (event) => {
      const visibleOptions = countryOptionElements.filter((option) => !option.hidden);
      const currentIndex = visibleOptions.indexOf(document.activeElement);
      let nextIndex;
      if (event.key === "Escape") {
        closeCountryPicker();
        countryTrigger.focus();
      } else if (event.key === "Tab") {
        closeCountryPicker();
      } else if (event.key === "ArrowDown") {
        nextIndex = Math.min(currentIndex + 1, visibleOptions.length - 1);
      } else if (event.key === "ArrowUp") {
        nextIndex = Math.max(currentIndex - 1, 0);
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = visibleOptions.length - 1;
      }
      if (nextIndex !== undefined && visibleOptions[nextIndex]) {
        event.preventDefault();
        visibleOptions[nextIndex].focus();
      }
    });
    countryTrigger.addEventListener("click", () => {
      if (countryPopover.hidden) openCountryPicker();
      else closeCountryPicker();
    });
    document.addEventListener("click", (event) => {
      if (!countryPicker.contains(event.target)) closeCountryPicker();
    });
    form.addEventListener("reset", () => {
      window.setTimeout(() => {
        const defaultOption = countryOptionElements.find((option) => option.dataset.iso === "za");
        countryCode.value = defaultOption.dataset.code;
        countryOptions.querySelectorAll('[role="option"]').forEach((option) => {
          option.setAttribute("aria-selected", String(option === defaultOption));
        });
        updateCountryTrigger("ZA", defaultOption.dataset.code, "South Africa");
      });
    });
    updateCountryTrigger("ZA", "+27", "South Africa");
    countryPopover.append(countrySearch, countryOptions);
    countryPicker.append(countryTrigger, countryPopover);

    phoneGroup.className = "phone-entry";
    phone.closest(".field").classList.add("phone-field");
    phone.parentNode.insertBefore(phoneGroup, phone);
    phoneGroup.append(countryPicker, phone, countryCode);
    phone.setAttribute("autocomplete", "tel-national");
    phone.setAttribute("placeholder", "Phone number");
  }

  const packageField = form.querySelector("#q-package");
  const sourceField = form.querySelector("#q-source");
  const query = new URLSearchParams(window.location.search);

  const normalizePackageValue = (value) => {
    if (typeof value !== "string") return "";
    const normalized = value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    if (["landing-page", "starter-website", "business-website", "care-plan", "digital-presence", "not-sure"].includes(normalized)) {
      return normalized;
    }
    const map = {
      landing: "landing-page",
      landingpage: "landing-page",
      starter: "starter-website",
      business: "business-website",
      care: "care-plan",
      "website-care": "care-plan",
      digitalpresence: "digital-presence",
      "presence-essentials": "digital-presence",
      "not-sure-yet": "not-sure",
      unsure: "not-sure",
      "talk-it-through": "not-sure",
    };
    return map[normalized] || "";
  };

  const normalizeSourceValue = (value) => {
    if (typeof value !== "string") return "website";
    const normalized = value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    const map = {
      website: "website",
      google: "google",
      referral: "referral",
      linkedin: "linkedin",
      whatsapp: "whatsapp",
      instagram: "instagram",
      facebook: "facebook",
      email: "email",
      other: "other",
      "google-search": "google",
      "googleads": "google",
      "word-of-mouth": "referral",
      wa: "whatsapp",
      ig: "instagram",
      fb: "facebook",
      mail: "email",
    };
    return map[normalized] || "other";
  };

  const requestedPackage = normalizePackageValue(
    query.get("package") || query.get("service") || query.get("offer") || "",
  );
  if (packageField && requestedPackage) {
    packageField.value = requestedPackage;
  }

  const requestedSource = normalizeSourceValue(
    query.get("source") || query.get("utm_source") || query.get("ref") || "website",
  );
  if (sourceField) {
    sourceField.value = requestedSource;
  }

  const submit = form.querySelector('button[type="submit"]');
  const summary = form.querySelector("[data-error-summary]");
  const list = form.querySelector("[data-error-list]");
  const live = form.querySelector("[data-live]");
  const success = form.querySelector("[data-form-success]");
  let isSubmitting = false;
  const turnstileContainer = form.querySelector("#enquiry-turnstile");
  let resetTurnstile = () => {};

  if (turnstileContainer && window.turnstile) {
    let turnstileWidgetId = null;
    let renderVersion = 0;
    resetTurnstile = () => {
      if (turnstileWidgetId !== null) window.turnstile.reset(turnstileWidgetId);
    };
    const renderTurnstile = () => {
      const currentVersion = ++renderVersion;
      window.turnstile.ready(() => {
        if (currentVersion !== renderVersion) return;
        if (turnstileWidgetId !== null) window.turnstile.remove(turnstileWidgetId);
        turnstileWidgetId = window.turnstile.render(turnstileContainer, {
          sitekey: turnstileContainer.dataset.sitekey,
          action: turnstileContainer.dataset.action,
          theme: document.documentElement.dataset.theme === "dark" ? "dark" : "light",
        });
      });
    };

    renderTurnstile();
    window.addEventListener("nearly:themechange", renderTurnstile);
  }

  const showError = (message) => {
    if (summary && list) {
      list.replaceChildren();
      const item = document.createElement("li");
      item.textContent = message;
      list.append(item);
      summary.hidden = false;
      summary.focus();
    }
    if (live) live.textContent = message;
  };

  form.addEventListener("invalid", (event) => {
    if (live && event.target.validationMessage) {
      live.textContent = event.target.validationMessage;
    }
  }, true);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (!form.reportValidity()) {
      if (live) live.textContent = "Please correct the highlighted fields before sending your enquiry.";
      return;
    }

    const packageValue = packageField ? packageField.value.trim() : "";
    if (packageValue && !["landing-page", "starter-website", "business-website", "care-plan", "not-sure"].includes(packageValue)) {
      showError("Please choose a valid service or leave the field blank.");
      return;
    }

    const formData = new FormData(form);
    const turnstileToken = formData.get("cf-turnstile-response");
    if (typeof turnstileToken !== "string" || !turnstileToken.trim()) {
      showError("Please complete the security check before sending your enquiry.");
      return;
    }

    if (summary && list) {
      list.replaceChildren();
      summary.hidden = true;
    }
    if (success) success.hidden = true;

    const previousLabel = submit.textContent;
    isSubmitting = true;
    submit.disabled = true;
    submit.textContent = "Sending…";
    if (live) live.textContent = "Sending your enquiry…";

    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData)),
      });
      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error("The server returned an unreadable response. We couldn't confirm delivery; please try again or email madebynearly@gmail.com.");
      }

      if (!response.ok || !result || typeof result !== "object" || result.success !== true) {
        const code = result && (result.error?.code || result.code);
        const message = code === "configuration_missing"
          ? "The enquiry form is not configured yet. Please email madebynearly@gmail.com directly."
          : result?.message || "The server couldn't confirm your enquiry. Please try again or email madebynearly@gmail.com.";
        throw new Error(message);
      }

      form.reset();
      if (success) {
        const successMessage = success.querySelector("p");
        if (successMessage) {
          successMessage.textContent = result.warning
            ? result.warning
            : "Your enquiry has been received. We'll reply by email within one working day. If you don't see our reply, please check your spam folder.";
        }
        success.hidden = false;
        success.focus();
      }
      if (live) {
        live.textContent = result.warning
          ? result.warning
          : "Your enquiry was received. We'll reply by email within one working day. Check your spam folder if you don't see our reply.";
      }
    } catch (error) {
      const message = error instanceof Error && error.name === "Error"
        ? error.message
        : "We couldn't confirm your enquiry was sent. Please try again or email madebynearly@gmail.com.";
      showError(message);
    } finally {
      isSubmitting = false;
      submit.disabled = false;
      submit.textContent = previousLabel;
      resetTurnstile();
    }
  });
  form.dataset.externalSubmitReady = "true";
})();
