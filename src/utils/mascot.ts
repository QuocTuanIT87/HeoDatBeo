export interface MascotOption {
  key: string;
  name: string;
  image: any;
}

export const MASCOT_LIST: MascotOption[] = [
  {
    key: 'adagio',
    name: 'Adagio',
    image: require('../../assets/series/mascot/adagio.png'),
  },
  {
    key: 'alpha',
    name: 'Alpha',
    image: require('../../assets/series/mascot/alpha.png'),
  },
  {
    key: 'ardan',
    name: 'Ardan',
    image: require('../../assets/series/mascot/ardan.png'),
  },
  {
    key: 'baptiste',
    name: 'Baptiste',
    image: require('../../assets/series/mascot/baptiste.png'),
  },
  {
    key: 'baron',
    name: 'Baron',
    image: require('../../assets/series/mascot/baron.png'),
  },
  {
    key: 'blackfeather',
    name: 'Blackfeather',
    image: require('../../assets/series/mascot/blackfeather.png'),
  },
  {
    key: 'catherine',
    name: 'Catherine',
    image: require('../../assets/series/mascot/catherine.png'),
  },
  {
    key: 'celeste',
    name: 'Celeste',
    image: require('../../assets/series/mascot/celeste.png'),
  },
  {
    key: 'clock_conan',
    name: 'Conan',
    image: require('../../assets/series/mascot/clock_conan.png'),
  },
  {
    key: 'cute_conan',
    name: 'Conan',
    image: require('../../assets/series/mascot/cute_conan.png'),
  },
  {
    key: 'doremon_cute',
    name: 'Doraemon',
    image: require('../../assets/series/mascot/doremon_cute.png'),
  },
  {
    key: 'doremon_solider',
    name: 'Doraemon',
    image: require('../../assets/series/mascot/doremon_solider.png'),
  },
  {
    key: 'flicker',
    name: 'Flicker',
    image: require('../../assets/series/mascot/flicker.png'),
  },
  {
    key: 'focus_conan',
    name: 'Conan',
    image: require('../../assets/series/mascot/focus_conan.png'),
  },
  {
    key: 'fortress',
    name: 'Fortress',
    image: require('../../assets/series/mascot/fortress.png'),
  },
  {
    key: 'glaive',
    name: 'Glaive',
    image: require('../../assets/series/mascot/glaive.png'),
  },
  {
    key: 'guitar_minion',
    name: 'Minion',
    image: require('../../assets/series/mascot/guitar_minion.png'),
  },
  {
    key: 'gwen',
    name: 'Gwen',
    image: require('../../assets/series/mascot/gwen.png'),
  },
  {
    key: 'kestrel',
    name: 'Kestrel',
    image: require('../../assets/series/mascot/kestrel.png'),
  },
  {
    key: 'lance',
    name: 'Lance',
    image: require('../../assets/series/mascot/lance.png'),
  },
  {
    key: 'lorelai',
    name: 'Lorelai',
    image: require('../../assets/series/mascot/lorelai.png'),
  },
  {
    key: 'lyra',
    name: 'Lyra',
    image: require('../../assets/series/mascot/lyra.png'),
  },
  {
    key: 'ozo',
    name: 'Ozo',
    image: require('../../assets/series/mascot/ozo.png'),
  },
  {
    key: 'petal',
    name: 'Petal',
    image: require('../../assets/series/mascot/petal.png'),
  },
  {
    key: 'phinn',
    name: 'Phinn',
    image: require('../../assets/series/mascot/phinn.png'),
  },
  {
    key: 'reim',
    name: 'Reim',
    image: require('../../assets/series/mascot/reim.png'),
  },
  {
    key: 'reza',
    name: 'Reza',
    image: require('../../assets/series/mascot/reza.png'),
  },
  {
    key: 'ringo',
    name: 'Ringo',
    image: require('../../assets/series/mascot/ringo.png'),
  },
  {
    key: 'rona',
    name: 'Rona',
    image: require('../../assets/series/mascot/rona.png'),
  },
  {
    key: 'saw',
    name: 'SAW',
    image: require('../../assets/series/mascot/saw.png'),
  },
  {
    key: 'skaarf',
    name: 'Skaarf',
    image: require('../../assets/series/mascot/skaarf.png'),
  },
  {
    key: 'skye',
    name: 'Skye',
    image: require('../../assets/series/mascot/skye.png'),
  },
  {
    key: 'three_minion',
    name: 'Bộ ba Minion',
    image: require('../../assets/series/mascot/three_minion.png'),
  },
  {
    key: 'vox',
    name: 'Vox',
    image: require('../../assets/series/mascot/vox.png'),
  },
];

export const getMascotImage = (mascotKey?: string) => {
  const found = MASCOT_LIST.find(m => m.key === mascotKey);
  return found ? found.image : MASCOT_LIST[0].image;
};
