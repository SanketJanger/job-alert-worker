// Applied after normalization, before insert. See README for the tuning
// workflow (query matched=1 and matched=0 rows after step 6 and adjust here).

export const TITLE_INCLUDE_NEW_GRAD = [
  "new grad",
  "new graduate",
  "university grad",
  "college grad",
  "campus",
  "early career",
  "entry level",
  "graduate software",
  "associate software engineer",
  "software engineer i",
  "software engineer 1",
  "sde i",
  "sde 1",
  "junior software",
  "jr. software",
  "recent graduate",
];

// Broad second pass -- catches any engineer/developer role, not just
// backend-labeled ones. Deliberately unspecific: word-order-dependent
// phrases like "platform engineer" miss titles like "Software Engineer,
// Developer Platform" (specialization word comes second), so a bare
// substring catch is more reliable here. TITLE_EXCLUDE carries the real
// filtering weight now -- see the additions below for hardware/sales/
// support noise this broader net pulls in.
export const TITLE_INCLUDE_ROLE = ["engineer", "developer", "programmer"];

export const TITLE_EXCLUDE = [
  "embedded",
  "firmware",
  "avionics",
  "fpga",
  "asic",
  "vlsi",
  "rtos",
  "intern",
  "internship",
  "co-op",
  "principal",
  "staff",
  "senior",
  "sr.",
  "lead",
  "manager",
  "salesforce",
  "servicenow",
  "peoplesoft",
  "pega",
  "sap",
  "workday consultant",
  "qa engineer",
  "quality assurance",
  "test engineer",
  "sdet",
  "clearance",
  "ts/sci",
  "secret",
  "polygraph",
  "us citizen",

  // Non-software engineering disciplines -- needed now that the include
  // list is a bare "engineer" catch. Bosch-scale industrial boards post
  // thousands of these.
  "mechanical",
  "electrical",
  "civil",
  "chemical",
  "manufacturing",
  "industrial",
  "hardware engineer",
  "electronics",
  "structural",
  "automotive",
  "quality engineer",
  "process engineer",
  "supply chain",
  "logistics",
  "procurement",

  // Customer-facing / non-coding "engineer" titles.
  "sales engineer",
  "solutions engineer",
  "solution engineer",
  "support engineer",
  "technical support",
  "field engineer",
  "field service",
  "service engineer",
  "developer relations",
  "developer advocate",
  "customer success",
  "recruiter",
  "recruiting",
  "it infrastructure",
  "gtm engineer",
];

// Location filter is a heuristic string match, tuned here since the ATS
// adapters normalize location down to a single free-text string. A location
// is treated as US/remote-US unless it contains a clear foreign-country
// marker with no accompanying US marker (see filter.ts).
export const NON_US_COUNTRY_MARKERS = [
  "india",
  "canada",
  "united kingdom",
  " uk",
  "england",
  "ireland",
  "germany",
  "france",
  "spain",
  "italy",
  "netherlands",
  "poland",
  "portugal",
  "sweden",
  "norway",
  "denmark",
  "finland",
  "switzerland",
  "austria",
  "belgium",
  "australia",
  "new zealand",
  "singapore",
  "japan",
  "china",
  "hong kong",
  "philippines",
  "vietnam",
  "indonesia",
  "malaysia",
  "thailand",
  "south korea",
  "korea",
  "israel",
  "mexico",
  "brazil",
  "argentina",
  "chile",
  "colombia",
  "peru",
  "south africa",
  "nigeria",
  "egypt",
  "uae",
  "united arab emirates",
  "saudi arabia",
  "pakistan",
  "bangladesh",
  "sri lanka",
  "romania",
  "ukraine",
  "russia",
  "turkey",
  "greece",
  "czech republic",
  "hungary",
  "bulgaria",
  "serbia",
  "croatia",
  "slovakia",
  "estonia",
  "latvia",
  "lithuania",
  "costa rica",
];

// ISO 3166-1 alpha-2 codes, matched case-sensitively as whole words against
// the RAW (non-lowercased) location string. SmartRecruiters reports country
// as a lowercase 2-letter code ("mx", "hu", "in"), not a full name, so the
// NON_US_COUNTRY_MARKERS list above never matches those locations at all --
// this is what actually catches them. Case-sensitivity is what keeps this
// list from colliding with US_STATE_CODES below: lowercase "in" here means
// India, uppercase "IN" there means Indiana -- same two letters,
// distinguished only by case, so never lowercase this list or uppercase
// the state one.
export const NON_US_COUNTRY_CODES = [
  "in","ca","gb","ie","de","fr","es","it","nl","pl","pt","se","no","dk","fi",
  "ch","at","be","au","nz","sg","jp","cn","hk","ph","vn","id","my","th","kr",
  "il","mx","br","ar","cl","co","pe","za","ng","eg","ae","sa","pk","bd","lk",
  "ro","ua","ru","tr","gr","cz","hu","bg","rs","hr","sk","ee","lv","lt","cr",
];

// Matched as whole words against the raw (non-lowercased) string so short
// codes like "OR" or "IN" don't false-positive inside unrelated words.
export const US_STATE_CODES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];