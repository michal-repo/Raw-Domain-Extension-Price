/* 
 * Usage Instructions: 
 * Login to Cloudflare dashboard, then open browser JS console, paste this JS code, then run it.
 * You can also change some "config" variables, if you want.
 */
async function mainScript(config = {}) {
    // configurable config example/default
    let defaultConfig = {
      tldList: ["academy", "accountant", "accountants", "actor", "agency", "apartments", "associates", "attorney", "auction", "band", "bar", "bargains", "bet", "bid", "bike", "bingo", "biz", "black", "blog", "blue", "boutique", "broker", "builders", "business", "cab", "cafe", "camera", "camp", "capital", "cards", "care", "careers", "cash", "casino", "catering", "cc", "center", "ceo", "chat", "cheap", "church", "city", "claims", "cleaning", "clinic", "clothing", "cloud", "coach", "codes", "coffee", "college", "com", "community", "company", "computer", "condos", "construction", "consulting", "contact", "contractors", "cool", "co.uk", "coupons", "credit", "creditcard", "cricket", "cruises", "dance", "date", "dating", "deals", "degree", "delivery", "democrat", "dental", "dentist", "design", "diamonds", "digital", "direct", "directory", "discount", "doctor", "dog", "domains", "download", "education", "email", "energy", "engineer", "engineering", "enterprises", "equipment", "estate", "events", "exchange", "expert", "express", "fail", "faith", "family", "fans", "farm", "finance", "financial", "fish", "fitness", "flights", "florist", "football", "forex", "forsale", "foundation", "fun", "fund", "furniture", "futbol", "fyi", "gallery", "games", "gifts", "gives", "glass", "gmbh", "gold", "golf", "graphics", "gratis", "green", "gripe", "group", "guide", "guru", "haus", "healthcare", "hockey", "holdings", "holiday", "hospital", "host", "house", "immo", "immobilien", "industries", "info", "ink", "institute", "insure", "international", "investments", "io", "irish", "jetzt", "jewelry", "kaufen", "kim", "kitchen", "land", "lawyer", "lease", "legal", "lgbt", "life", "lighting", "limited", "limo", "live", "loan", "loans", "love", "ltd", "maison", "management", "market", "marketing", "markets", "mba", ".me", "media", "memorial", "men", "me.uk", "mobi", "moda", "money", "mortgage", "movie", "net", "network", "news", "ninja", "observer", "online", "org", "org.uk", "partners", "parts", "party", "pet", "photography", "photos", "pictures", "pink", "pizza", "place", "plumbing", "plus", "press", "pro", "productions", "promo", "properties", "pub", "racing", "realty", "recipes", "red", "rehab", "reise", "reisen", "rent", "rentals", "repair", "report", "republican", "rest", "restaurant", "review", "reviews", "rip", "rocks", "run", "sale", "salon", "sarl", "school", "schule", "science", "security", "services", "shoes", "shopping", "show", "singles", "site", "soccer", "social", "software", "solar", "solutions", "space", "storage", "store", "stream", "studio", "style", "supplies", "supply", "support", "surgery", "systems", "tax", "taxi", "team", "tech", "technology", "tennis", "theater", "theatre", "tienda", "tips", "tires", "today", "tools", "tours", "town", "toys", "trade", "trading", "training", "tv", "uk", "university", "us", "vacations", "ventures", "vet", "viajes", "video", "villas", "vin", "vision", "voyage", "watch", "webcam", "website", "wiki", "win", "wine", "works", "world", "wtf", "xyz", "zone"],
      isDownloadAsCsv: true,
      isPrintDebugLog: true,
      tldCountPerSubRequest: 50,
      dummyDomainName: "forgivemeforthis4321",
    };
    let cfg = Object.assign(config, defaultConfig);
    // isDebugMode. 1 to print debug. 0 to disable.
    let dd = cfg.isPrintDebugLog;
  
    /* API Get current logged in Account details */
    let getAccountResp = await fetch("https://dash.cloudflare.com/api/v4/system/bootstrap", {
        "headers": {
          "x-cross-site-security": "dash"
        },
        "method": "GET",
      })
      .then(response => response.json());
    dd && console.log("getAccountResp:", getAccountResp);
    let cfAtokHeader = getAccountResp.result.data.atok;
    let cfUserId = getAccountResp.result.data.data.user.primary_account_tag;
  
    let tldSuffix = cfg.dummyDomainName;
    let rawTlds = cfg.tldList;
    // Chunk the tld array, so that each request doesn't send too much number of tlds
    let tldsDetail = [];
  
    let chunkRawTlds = chunkArray(rawTlds, cfg.tldCountPerSubRequest);
    for (const rawTlds of chunkRawTlds) {
      let tldsParam = rawTlds.map(tld => tldSuffix + "." + tld);
      let queryTldsPayload = JSON.stringify({
        "id": tldsParam
      });
  
      // delay a few miliseconds between request
      await new Promise(resolve => setTimeout(resolve, 500));
  
      /* API Get TLDs details */
      let getTldsChunkResp = await fetch("https://dash.cloudflare.com/api/v4/accounts/" + cfUserId + "/registrar/domains", {
          "headers": {
            "content-type": "application/json",
            "x-atok": cfAtokHeader,
            "x-cross-site-security": "dash"
          },
          "body": queryTldsPayload,
          "method": "POST",
        })
        .then(response => response.json());
      dd && console.log("getTldsChunkResp:", getTldsChunkResp);
      tldsDetail = [].concat(tldsDetail, getTldsChunkResp.result);
    }
  
    let tldsPricingCsvOutput = "tld_name,renewal_price_usd,registration_price_usd\r\n";
  
    let tldsPricing = (tldsDetail).map((tld, idx) => {
      let tldPricing = {
        tld_name: ((tld.name).split('.'))[1],
        renewal_price_usd: tld.fees.renewal_fee,
        registration_price_usd: tld.fees.registration_fee
      };
      tldsPricingCsvOutput += (tldPricing.tld_name + "," + tldPricing.renewal_price_usd + "," + tldPricing.registration_price_usd + "\r\n");
      return tldPricing;
    });
    dd && console.log("tldsPricing:", tldsPricing);
    // print final output in CSV format
    console.log(tldsPricingCsvOutput);
  
    if (cfg.isDownloadAsCsv) {
      // Trigger browser download
      downloadAsCsvFile(tldsPricingCsvOutput, "tld_pricing.csv")
    }
  
    // HELPER FUNCTIONS below
    function chunkArray(arr, size) {
      return arr.length > size ? [arr.slice(0, size), ...chunkArray(arr.slice(size), size)] : [arr];
    }
  
    function downloadAsCsvFile(outputString = "", filename = "out.csv") {
      let encodedUri = encodeURI(outputString);
      let link = document.createElement("a");
      link.setAttribute("href", "data:text/csv;charset=utf-8," + encodedUri);
      link.setAttribute("download", filename);
      document.body.appendChild(link); // Required for FF
      link.click()
    }
  }
  
  mainScript();