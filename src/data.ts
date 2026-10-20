export interface Era {
  id: string
  year: string
  name: string
  en: string
  tagline: string
  grid: [number, number]
  palette: {
    skyTop: string
    skyBottom: string
    sun: string
    mt1: string
    mt2: string
    ground: string
    hero: string
    hero2: string
    outline: string
  }
  tech: string[]
  desc: string
  style: '8bit' | '16bit' | 'early3d' | 'modern' | 'stylized'
}

export const eras: Era[] = [
  {
    id: '8bit',
    year: '1980',
    name: '8-bit',
    en: 'Blocky Hero',
    tagline: '四个颜色，就能装下一整个世界。',
    grid: [26, 18],
    palette: { skyTop: '#0d1b4d', skyBottom: '#3d5fc4', sun: '#f6e05e', mt1: '#1d2b78', mt2: '#33479c', ground: '#6b4a1c', hero: '#ff8b3d', hero2: '#fff3c4', outline: '#101010' },
    tech: ['4 色调色板', '8×8 瓦片', '方块精灵', '单层卷轴'],
    desc: '内存只有几个 KB 的年代，像素被迫成为主角。每一个方块都要精打细算，却也因此有了最倔强的表情。',
    style: '8bit',
  },
  {
    id: '16bit',
    year: '1992',
    name: '16-bit',
    en: 'Parallax World',
    tagline: '十六种颜色与多层视差，世界开始有了纵深。',
    grid: [52, 32],
    palette: { skyTop: '#1b3a8f', skyBottom: '#7fa7f0', sun: '#ffd95e', mt1: '#27408b', mt2: '#4169b2', ground: '#3f7d3f', hero: '#e33d55', hero2: '#ffe08a', outline: '#15101d' },
    tech: ['16 色调色板', '多层视差卷轴', 'Mode 7', '角色描边'],
    desc: '色彩的位数翻倍，世界从平面走向立体。前景、中景、远景各走各的速度，奔跑时终于有了「冲进画面」的感觉。',
    style: '16bit',
  },
  {
    id: 'early3d',
    year: '1997',
    name: '早期 3D',
    en: 'Polygon Dawn',
    tagline: '三角形拼成的世界，在雾里慢慢浮出来。',
    grid: [88, 52],
    palette: { skyTop: '#16161d', skyBottom: '#3a4252', sun: '#8f9aa8', mt1: '#4a5364', mt2: '#626c7e', ground: '#4c4a46', hero: '#8f6f4a', hero2: '#b09a76', outline: '#0c0c0e' },
    tech: ['平面着色多边形', '距离雾效', '抖动渐变', '低分辨率贴图'],
    desc: '显卡刚刚学会画三角形。锯齿、雾效与抖动是那个时代的技术胎记，也是许多人第一次走进「立体空间」的入口。',
    style: 'early3d',
  },
  {
    id: 'modern',
    year: '2013',
    name: '现代 3D',
    en: 'Real-time Light',
    tagline: '实时光照与柔和阴影，屏幕后是一个被点亮的宇宙。',
    grid: [168, 94],
    palette: { skyTop: '#2b5876', skyBottom: '#e2b96f', sun: '#ffd97a', mt1: '#3f6275', mt2: '#68899b', ground: '#31543b', hero: '#d94f4f', hero2: '#f2c57c', outline: '#1b2430' },
    tech: ['实时全局光照', '法线贴图', '物理渲染', '景深与辉光'],
    desc: '光线学会了反弹、散射与着色。每一帧都在实时计算，雾散了，世界清晰得能看见远处山脉的阴影。',
    style: 'modern',
  },
  {
    id: 'stylized',
    year: '2019',
    name: '风格化',
    en: 'Cel-shaded',
    tagline: '放弃真实，反而得到了更像自己的样子。',
    grid: [128, 72],
    palette: { skyTop: '#f2a9c8', skyBottom: '#fde3a7', sun: '#ffe07a', mt1: '#9c6bd6', mt2: '#c58bd8', ground: '#6fc4a0', hero: '#ff6f91', hero2: '#ffe1e8', outline: '#2a2035' },
    tech: ['卡通描边', '色块阴影', '手绘纹理', '风格化渲染'],
    desc: '当写实走到尽头，画面开始重新寻找「画」的感觉。描边、平涂与大胆配色，让游戏看起来像一本会动的绘本。',
    style: 'stylized',
  },
]

export const specCards = [
  { era: '8-bit', item: '精灵 8×8', note: '把角色塞进最小的方格，是那时的极限运动。' },
  { era: '16-bit', item: '视差卷轴', note: '三层层级用不同速度移动，纵深由此诞生。' },
  { era: '早期 3D', item: '平面着色', note: '每张三角形只有一种颜色，光还没有学会渐变。' },
  { era: '现代 3D', item: '物理渲染', note: '光的反射、吸收与散射被实时计算。' },
  { era: '风格化', item: '卡通描边', note: '黑线包住色块，写实被重新诗意地改写。' },
]
