export class Player {
  constructor(name, human) {
    this.name = name;
    this.human = human;
  }

  isHuman() {
    return this.human;
  }

  chooseMove(game) {
    return null;
  }
}
