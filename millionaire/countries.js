const RAW_COUNTRIES = [
  ['AF','Afghanistan','AFN'],['AL','Albania','ALL'],['DZ','Algeria','DZD'],['AD','Andorra','EUR'],['AO','Angola','AOA'],
  ['AG','Antigua and Barbuda','XCD'],['AR','Argentina','ARS'],['AM','Armenia','AMD'],['AU','Australia','AUD'],['AT','Austria','EUR'],
  ['AZ','Azerbaijan','AZN'],['BS','Bahamas','BSD'],['BH','Bahrain','BHD'],['BD','Bangladesh','BDT'],['BB','Barbados','BBD'],
  ['BY','Belarus','BYN'],['BE','Belgium','EUR'],['BZ','Belize','BZD'],['BJ','Benin','XOF'],['BT','Bhutan','BTN'],
  ['BO','Bolivia','BOB'],['BA','Bosnia and Herzegovina','BAM'],['BW','Botswana','BWP'],['BR','Brazil','BRL'],['BN','Brunei','BND'],
  ['BG','Bulgaria','EUR'],['BF','Burkina Faso','XOF'],['BI','Burundi','BIF'],['CV','Cabo Verde','CVE'],['KH','Cambodia','KHR'],
  ['CM','Cameroon','XAF'],['CA','Canada','CAD'],['CF','Central African Republic','XAF'],['TD','Chad','XAF'],['CL','Chile','CLP'],
  ['CN','China','CNY'],['CO','Colombia','COP'],['KM','Comoros','KMF'],['CG','Republic of the Congo','XAF'],['CD','Democratic Republic of the Congo','CDF'],
  ['CR','Costa Rica','CRC'],['CI','Côte d’Ivoire','XOF'],['HR','Croatia','EUR'],['CU','Cuba','CUP'],['CY','Cyprus','EUR'],
  ['CZ','Czechia','CZK'],['DK','Denmark','DKK'],['DJ','Djibouti','DJF'],['DM','Dominica','XCD'],['DO','Dominican Republic','DOP'],
  ['EC','Ecuador','USD'],['EG','Egypt','EGP'],['SV','El Salvador','USD'],['GQ','Equatorial Guinea','XAF'],['ER','Eritrea','ERN'],
  ['EE','Estonia','EUR'],['SZ','Eswatini','SZL'],['ET','Ethiopia','ETB'],['FJ','Fiji','FJD'],['FI','Finland','EUR'],
  ['FR','France','EUR'],['GA','Gabon','XAF'],['GM','Gambia','GMD'],['GE','Georgia','GEL'],['DE','Germany','EUR'],
  ['GH','Ghana','GHS'],['GR','Greece','EUR'],['GD','Grenada','XCD'],['GT','Guatemala','GTQ'],['GN','Guinea','GNF'],
  ['GW','Guinea-Bissau','XOF'],['GY','Guyana','GYD'],['HT','Haiti','HTG'],['HN','Honduras','HNL'],['HU','Hungary','HUF'],
  ['IS','Iceland','ISK'],['IN','India','INR'],['ID','Indonesia','IDR'],['IR','Iran','IRR'],['IQ','Iraq','IQD'],
  ['IE','Ireland','EUR'],['IL','Israel','ILS'],['IT','Italy','EUR'],['JM','Jamaica','JMD'],['JP','Japan','JPY'],
  ['JO','Jordan','JOD'],['KZ','Kazakhstan','KZT'],['KE','Kenya','KES'],['KI','Kiribati','AUD'],['XK','Kosovo','EUR'],
  ['KW','Kuwait','KWD'],['KG','Kyrgyzstan','KGS'],['LA','Laos','LAK'],['LV','Latvia','EUR'],['LB','Lebanon','LBP'],
  ['LS','Lesotho','LSL'],['LR','Liberia','LRD'],['LY','Libya','LYD'],['LI','Liechtenstein','CHF'],['LT','Lithuania','EUR'],
  ['LU','Luxembourg','EUR'],['MG','Madagascar','MGA'],['MW','Malawi','MWK'],['MY','Malaysia','MYR'],['MV','Maldives','MVR'],
  ['ML','Mali','XOF'],['MT','Malta','EUR'],['MH','Marshall Islands','USD'],['MR','Mauritania','MRU'],['MU','Mauritius','MUR'],
  ['MX','Mexico','MXN'],['FM','Micronesia','USD'],['MD','Moldova','MDL'],['MC','Monaco','EUR'],['MN','Mongolia','MNT'],
  ['ME','Montenegro','EUR'],['MA','Morocco','MAD'],['MZ','Mozambique','MZN'],['MM','Myanmar','MMK'],['NA','Namibia','NAD'],
  ['NR','Nauru','AUD'],['NP','Nepal','NPR'],['NL','Netherlands','EUR'],['NZ','New Zealand','NZD'],['NI','Nicaragua','NIO'],
  ['NE','Niger','XOF'],['NG','Nigeria','NGN'],['KP','North Korea','KPW'],['MK','North Macedonia','MKD'],['NO','Norway','NOK'],['OM','Oman','OMR'],
  ['PK','Pakistan','PKR'],['PW','Palau','USD'],['PS','Palestine','ILS'],['PA','Panama','PAB'],['PG','Papua New Guinea','PGK'],
  ['PY','Paraguay','PYG'],['PE','Peru','PEN'],['PH','Philippines','PHP'],['PL','Poland','PLN'],['PT','Portugal','EUR'],
  ['QA','Qatar','QAR'],['RO','Romania','RON'],['RU','Russia','RUB'],['RW','Rwanda','RWF'],['KN','Saint Kitts and Nevis','XCD'],
  ['LC','Saint Lucia','XCD'],['VC','Saint Vincent and the Grenadines','XCD'],['WS','Samoa','WST'],['SM','San Marino','EUR'],['ST','São Tomé and Príncipe','STN'],
  ['SA','Saudi Arabia','SAR'],['SN','Senegal','XOF'],['RS','Serbia','RSD'],['SC','Seychelles','SCR'],['SL','Sierra Leone','SLE'],
  ['SG','Singapore','SGD'],['SK','Slovakia','EUR'],['SI','Slovenia','EUR'],['SB','Solomon Islands','SBD'],['SO','Somalia','SOS'],
  ['ZA','South Africa','ZAR'],['KR','South Korea','KRW'],['SS','South Sudan','SSP'],['ES','Spain','EUR'],['LK','Sri Lanka','LKR'],
  ['SD','Sudan','SDG'],['SR','Suriname','SRD'],['SE','Sweden','SEK'],['CH','Switzerland','CHF'],['SY','Syria','SYP'],
  ['TW','Taiwan','TWD'],['TJ','Tajikistan','TJS'],['TZ','Tanzania','TZS'],['TH','Thailand','THB'],['TL','Timor-Leste','USD'],
  ['TG','Togo','XOF'],['TO','Tonga','TOP'],['TT','Trinidad and Tobago','TTD'],['TN','Tunisia','TND'],['TR','Türkiye','TRY'],
  ['TM','Turkmenistan','TMT'],['TV','Tuvalu','AUD'],['UG','Uganda','UGX'],['UA','Ukraine','UAH'],['AE','United Arab Emirates','AED'],
  ['GB','United Kingdom','GBP'],['US','United States','USD'],['UY','Uruguay','UYU'],['UZ','Uzbekistan','UZS'],['VU','Vanuatu','VUV'],
  ['VA','Vatican City','EUR'],['VE','Venezuela','VES'],['VN','Vietnam','VND'],['YE','Yemen','YER'],['ZM','Zambia','ZMW'],['ZW','Zimbabwe','ZWG'],
];

// Regions Google GeoChart renders separately from the sovereign-country list above.
// They are map-only: they never change the 197-country count or milestone ranking.
// Western Sahara uses MAD as a practical currency proxy; this is not a sovereignty claim.
const RAW_MAP_TERRITORIES = [
  ['GL','Greenland','DKK'],['FO','Faroe Islands','DKK'],['AX','Åland Islands','EUR'],
  ['GF','French Guiana','EUR'],['GP','Guadeloupe','EUR'],['MQ','Martinique','EUR'],['RE','Réunion','EUR'],['YT','Mayotte','EUR'],
  ['PM','Saint Pierre and Miquelon','EUR'],['BL','Saint Barthélemy','EUR'],['MF','Saint Martin','EUR'],
  ['NC','New Caledonia','XPF'],['PF','French Polynesia','XPF'],['WF','Wallis and Futuna','XPF'],
  ['PR','Puerto Rico','USD'],['VI','U.S. Virgin Islands','USD'],['GU','Guam','USD'],['AS','American Samoa','USD'],['MP','Northern Mariana Islands','USD'],
  ['HK','Hong Kong','HKD'],['MO','Macau','MOP'],
  ['BM','Bermuda','BMD'],['KY','Cayman Islands','KYD'],['VG','British Virgin Islands','USD'],['AI','Anguilla','XCD'],['MS','Montserrat','XCD'],
  ['FK','Falkland Islands','FKP'],['GI','Gibraltar','GIP'],['IM','Isle of Man','GBP'],['JE','Jersey','GBP'],['GG','Guernsey','GBP'],['SH','Saint Helena','SHP'],['TC','Turks and Caicos Islands','USD'],
  ['CK','Cook Islands','NZD'],['NU','Niue','NZD'],['TK','Tokelau','NZD'],['PN','Pitcairn Islands','NZD'],
  ['AW','Aruba','AWG'],['CW','Curaçao','XCG'],['SX','Sint Maarten','XCG'],['BQ','Caribbean Netherlands','USD'],
  ['CX','Christmas Island','AUD'],['CC','Cocos Islands','AUD'],['NF','Norfolk Island','AUD'],
  ['IO','British Indian Ocean Territory','USD'],['EH','Western Sahara','MAD'],
];

function flagFromCode(code) {
  return [...code].map((letter) => String.fromCodePoint(127397 + letter.charCodeAt(0))).join('');
}

export const ALL_COUNTRIES = RAW_COUNTRIES.map(([code, country, currency]) => ({
  code,
  country,
  currency,
  flag: flagFromCode(code),
}));

export const MAP_TERRITORIES = RAW_MAP_TERRITORIES.map(([code, country, currency]) => ({ code, country, currency }));
export const COUNTRIES = ALL_COUNTRIES;
export const EURO_COUNTRIES = ALL_COUNTRIES.filter((item) => item.currency === 'EUR');
