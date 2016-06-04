// IRB-specific utils

export * from 'mixpanel-common/util';
export * from 'mixpanel-common/report/util';

export function getTextWidth(text, font) {
  const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement('canvas'));
  let context = canvas.getContext('2d');
  context.font = font;
  return context.measureText(text).width;
}
