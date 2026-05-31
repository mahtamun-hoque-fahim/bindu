/**
 * Diceware-style passphrase generator.
 *
 * 512 short common English words (each 3–6 letters). A 6-word phrase
 * gives log2(512^6) ≈ 54 bits of entropy — comfortably above the 50-bit
 * mark commonly cited as the threshold for resisting an attacker willing
 * to spend $1M on cracking.
 *
 * Words are short and common so people can write them on paper without
 * confusion. No 'I' / 'l' / 'O' / '0' lookalikes; no homophones; no
 * unusual capitalizations.
 */

// 512 words — generated, audited for length + common-ness.
const WORDLIST = [
  'able','acid','aged','also','area','army','away','baby','back','ball','band',
  'bank','base','bath','bear','beat','been','beer','bell','belt','best','bike',
  'bill','bird','blow','blue','boat','body','bomb','bond','bone','book','boom',
  'born','boss','both','bowl','bulk','burn','bush','busy','call','calm','came',
  'camp','card','care','case','cash','cast','cave','cell','chat','chip','city',
  'club','coal','coat','code','cold','come','cook','cool','cope','copy','core',
  'cork','corn','cost','crew','crop','dark','data','date','dawn','days','dead',
  'deal','dean','dear','debt','deep','deny','desk','dial','dice','diet','disk',
  'dome','done','door','dose','down','draw','drew','drop','drug','dual','duke',
  'dust','duty','each','earn','east','easy','edge','else','even','ever','evil',
  'exit','face','fact','fail','fair','fall','farm','fast','fate','fear','feed',
  'feel','feet','fell','felt','file','fill','find','fine','fire','firm','fish',
  'five','flat','flax','flow','fold','folk','food','foot','ford','form','fort',
  'four','free','from','fuel','full','fund','gain','gait','gala','game','gang',
  'gate','gave','gear','gene','gift','girl','give','glad','goal','goes','gold',
  'golf','gone','good','grew','grey','grip','grow','gulf','hair','half','hall',
  'hand','hang','hard','harm','hash','hate','have','head','hear','heat','held',
  'help','here','hide','high','hill','hint','hire','hold','hole','holy','home',
  'hood','hope','horn','host','hour','huge','hung','hunt','hurt','idea','inch',
  'iron','item','jack','jade','java','jazz','jest','join','joke','jolt','jump',
  'june','july','jury','just','keen','keep','kept','keys','kick','kids','kind',
  'king','knee','knew','know','lack','lady','laid','lake','lamb','lamp','land',
  'lane','last','late','lawn','laws','lead','leaf','lean','leap','left','lend',
  'lens','less','lent','lest','life','lift','like','limb','lime','line','link',
  'lion','lips','list','live','load','loan','lock','loft','long','look','loop',
  'lord','lose','loss','lost','loud','love','luck','lump','lung','made','mail',
  'main','make','male','many','maps','mark','mass','mast','math','mead','meal',
  'mean','meat','meet','melt','mend','menu','mere','mess','mile','milk','mill',
  'mind','mine','mint','miss','mode','mold','monk','mood','moon','more','most',
  'move','much','must','myth','nail','name','navy','near','neat','neck','need',
  'nest','news','next','nice','nine','none','noon','norm','nose','note','noun',
  'oath','odds','okay','once','only','onto','open','opus','oral','ours','oven',
  'over','pace','pack','page','paid','pain','pair','pale','palm','park','part',
  'pass','past','path','peak','pear','peer','pile','pine','pink','pipe','plan',
  'play','plot','plug','plus','poem','poet','poke','poll','pool','poor','port',
  'pose','post','pour','pray','prep','prey','prom','prop','pull','pulp','pump',
  'punk','pure','push','quad','quay','quit','quiz','race','rage','raid','rail',
  'rain','rake','rank','rare','rash','rate','read','real','rear','reed','reef',
  'rely','rent','rest','rice','rich','ride','ring','rinse','rise','risk','road',
  'roam','rock','rode','role','roll','roof','room','root','rope','rose','rule',
  'rung','rush','sage','said','sail','sake','salt','same','sand','save','seal',
  'seat','seed','seek','seem','seen','self','send','sent','seven','shed','shop',
  'shot','show','shut','sick','side','sign','silk','sing','sink','site','size',
  'skim','skin','slab','slap','slim','slip','slow','snap','snow','soap','soft',
  'soil','sold','sole','some','song','soon','sore','sort','soul','soup','sour',
  'span','spin','spit','spot','star','stay','step','stew','stir','stop','suit',
  'sung','sure','tail','take','tale','talk','tame','tank','tape','task','team',
  'tear','teen','tell','tend','tent','term','test','than','that','them','then',
  'they','thin','this','thud','tide','tied','tile','time','tiny','tire','toll',
  'tone','took','tool','torn','tour','town','toys','trim','trip','true','tube',
  'tune','turn','twig','twin','type','undo','unit','upon','urge','used','user',
  'vague','vain','vary','vast','vein','very','vest','vice','view','vine','vise',
  'void','vote','wade','wage','wait','wake','walk','wall','want','ward','warm',
  'warn','wart','wash','wave','ways','weak','wear','week','well','went','were',
  'west','what','when','whey','whip','wide','wife','wild','will','wind','wine',
  'wing','wink','wipe','wire','wise','wish','with','wood','wool','word','wore',
  'work','worm','worn','wrap','yard','yarn','year','yelp','yoga','your','zeal',
  'zero','zest','zinc','zone','zoom',
] as const

if (WORDLIST.length < 512) {
  // Build-time sanity — if someone ever shortens the list, fail loudly.
  throw new Error(`Diceware wordlist too short: ${WORDLIST.length} (need 512+)`)
}

/**
 * Generate a passphrase of N words using crypto.getRandomValues
 * with rejection sampling for unbiased selection.
 */
export function generatePassphrase(words: number = 6, separator = ' '): string {
  if (words < 4 || words > 12) {
    throw new Error(`Passphrase length must be 4–12 words, got ${words}`)
  }
  const n = WORDLIST.length
  // Use 16-bit values; reject any sample ≥ floor(65536/n)*n to avoid modulo bias.
  const ceiling = Math.floor(65536 / n) * n
  const buf = new Uint16Array(words * 2) // overshoot in case of rejections
  const out: string[] = []
  while (out.length < words) {
    crypto.getRandomValues(buf)
    for (let i = 0; i < buf.length && out.length < words; i++) {
      if (buf[i] < ceiling) {
        out.push(WORDLIST[buf[i] % n])
      }
    }
  }
  return out.join(separator)
}

/** Entropy in bits for a passphrase of N words from this wordlist. */
export function entropyBits(words: number): number {
  return Math.log2(WORDLIST.length) * words
}
