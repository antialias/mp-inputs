// IRB-specific utils

export * from './mp-common/data-util';
export * from './mp-common/report/util';

export function getTextWidth(text, font) {
  const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement('canvas'));
  let context = canvas.getContext('2d');
  context.font = font;
  return context.measureText(text).width;
}
