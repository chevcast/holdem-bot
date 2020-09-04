export default function (x, y, size, offset, sides) {
  const shapePoints: any[] = [];
  for (let index = 0; index < sides; index++) {
    shapePoints.push([
      x + size * Math.cos((index + offset) * 2 * Math.PI / sides),
      y + size * Math.sin((index + offset) * 2 * Math.PI / sides)
    ]);
  }
  return shapePoints;
}
