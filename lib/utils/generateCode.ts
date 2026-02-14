export function generiereIndividuellenCode(): string {
  const zeichen = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += zeichen.charAt(Math.floor(Math.random() * zeichen.length));
  }
  return code;
}
