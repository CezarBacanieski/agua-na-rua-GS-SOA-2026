export class RegraViolada extends Error {
  constructor(public readonly codigo: string, mensagem: string) {
    super(mensagem);
    this.name = 'RegraViolada';
  }
}
