// TODO: support nested structures recursively

export const unrolledGet = (manager, flyweight) => {
  if(manager._props.length == 1) return eid => {
      flyweight[manager._props[0]] = manager[manager._props[0]][eid]
      return flyweight
  } 
  else if(manager._props.length == 2) return eid => {
      flyweight[manager._props[0]] = manager[manager._props[0]][eid]
      flyweight[manager._props[1]] = manager[manager._props[1]][eid]
      return flyweight
  } 
  else if(manager._props.length == 3) return eid => {
      flyweight[manager._props[0]] = manager[manager._props[0]][eid]
      flyweight[manager._props[1]] = manager[manager._props[1]][eid]
      flyweight[manager._props[2]] = manager[manager._props[2]][eid]
      return flyweight
  } 
  else if(manager._props.length == 4) return eid => {
      flyweight[manager._props[0]] = manager[manager._props[0]][eid]
      flyweight[manager._props[1]] = manager[manager._props[1]][eid]
      flyweight[manager._props[2]] = manager[manager._props[2]][eid]
      flyweight[manager._props[3]] = manager[manager._props[3]][eid]
      return flyweight
  }
  else if(manager._props.length == 5) return eid => {
      flyweight[manager._props[0]] = manager[manager._props[0]][eid]
      flyweight[manager._props[1]] = manager[manager._props[1]][eid]
      flyweight[manager._props[2]] = manager[manager._props[2]][eid]
      flyweight[manager._props[3]] = manager[manager._props[3]][eid]
      flyweight[manager._props[4]] = manager[manager._props[4]][eid]
      return flyweight
  }
  else if(manager._props.length == 6) return eid => {
      flyweight[manager._props[0]] = manager[manager._props[0]][eid]
      flyweight[manager._props[1]] = manager[manager._props[1]][eid]
      flyweight[manager._props[2]] = manager[manager._props[2]][eid]
      flyweight[manager._props[3]] = manager[manager._props[3]][eid]
      flyweight[manager._props[4]] = manager[manager._props[4]][eid]
      flyweight[manager._props[5]] = manager[manager._props[5]][eid]
      return flyweight
  }
  else if(manager._props.length == 7) return eid => {
      flyweight[manager._props[0]] = manager[manager._props[0]][eid]
      flyweight[manager._props[1]] = manager[manager._props[1]][eid]
      flyweight[manager._props[2]] = manager[manager._props[2]][eid]
      flyweight[manager._props[3]] = manager[manager._props[3]][eid]
      flyweight[manager._props[4]] = manager[manager._props[4]][eid]
      flyweight[manager._props[5]] = manager[manager._props[5]][eid]
      flyweight[manager._props[6]] = manager[manager._props[6]][eid]
      return flyweight
  }
  else if(manager._props.length == 8) return eid => {
      flyweight[manager._props[0]] = manager[manager._props[0]][eid]
      flyweight[manager._props[1]] = manager[manager._props[1]][eid]
      flyweight[manager._props[2]] = manager[manager._props[2]][eid]
      flyweight[manager._props[3]] = manager[manager._props[3]][eid]
      flyweight[manager._props[4]] = manager[manager._props[4]][eid]
      flyweight[manager._props[5]] = manager[manager._props[5]][eid]
      flyweight[manager._props[6]] = manager[manager._props[6]][eid]
      flyweight[manager._props[7]] = manager[manager._props[7]][eid]
      return flyweight
  }
  else if(manager._props.length == 9) return eid => {
      flyweight[manager._props[0]] = manager[manager._props[0]][eid]
      flyweight[manager._props[1]] = manager[manager._props[1]][eid]
      flyweight[manager._props[2]] = manager[manager._props[2]][eid]
      flyweight[manager._props[3]] = manager[manager._props[3]][eid]
      flyweight[manager._props[4]] = manager[manager._props[4]][eid]
      flyweight[manager._props[5]] = manager[manager._props[5]][eid]
      flyweight[manager._props[6]] = manager[manager._props[6]][eid]
      flyweight[manager._props[7]] = manager[manager._props[7]][eid]
      flyweight[manager._props[8]] = manager[manager._props[8]][eid]
      return flyweight
  }
  else if(manager._props.length == 10) return eid => {
      flyweight[manager._props[0]] = manager[manager._props[0]][eid]
      flyweight[manager._props[1]] = manager[manager._props[1]][eid]
      flyweight[manager._props[2]] = manager[manager._props[2]][eid]
      flyweight[manager._props[3]] = manager[manager._props[3]][eid]
      flyweight[manager._props[4]] = manager[manager._props[4]][eid]
      flyweight[manager._props[5]] = manager[manager._props[5]][eid]
      flyweight[manager._props[6]] = manager[manager._props[6]][eid]
      flyweight[manager._props[7]] = manager[manager._props[7]][eid]
      flyweight[manager._props[8]] = manager[manager._props[8]][eid]
      flyweight[manager._props[9]] = manager[manager._props[9]][eid]
      return flyweight
  }
}

export const unrolledSet = (manager, flyweight) => {
  if(manager._props.length == 1) return eid => {
      manager[manager._props[0]][eid] = flyweight[manager._props[0]]
      return flyweight
  } 
  else if(manager._props.length == 2) return eid => {
      manager[manager._props[0]][eid] = flyweight[manager._props[0]]
      manager[manager._props[1]][eid] = flyweight[manager._props[1]]
      return flyweight
  } 
  else if(manager._props.length == 3) return eid => {
      manager[manager._props[0]][eid] = flyweight[manager._props[0]]
      manager[manager._props[1]][eid] = flyweight[manager._props[1]]
      manager[manager._props[2]][eid] = flyweight[manager._props[2]]
      return flyweight
  } 
  else if(manager._props.length == 4) return eid => {
      manager[manager._props[0]][eid] = flyweight[manager._props[0]]
      manager[manager._props[1]][eid] = flyweight[manager._props[1]]
      manager[manager._props[2]][eid] = flyweight[manager._props[2]]
      manager[manager._props[3]][eid] = flyweight[manager._props[3]]
      return flyweight
  }
  else if(manager._props.length == 5) return eid => {
      manager[manager._props[0]][eid] = flyweight[manager._props[0]]
      manager[manager._props[1]][eid] = flyweight[manager._props[1]]
      manager[manager._props[2]][eid] = flyweight[manager._props[2]]
      manager[manager._props[3]][eid] = flyweight[manager._props[3]]
      manager[manager._props[4]][eid] = flyweight[manager._props[4]]
      return flyweight
  }
  else if(manager._props.length == 6) return eid => {
      manager[manager._props[0]][eid] = flyweight[manager._props[0]]
      manager[manager._props[1]][eid] = flyweight[manager._props[1]]
      manager[manager._props[2]][eid] = flyweight[manager._props[2]]
      manager[manager._props[3]][eid] = flyweight[manager._props[3]]
      manager[manager._props[4]][eid] = flyweight[manager._props[4]]
      manager[manager._props[5]][eid] = flyweight[manager._props[5]]
      return flyweight
  }
  else if(manager._props.length == 7) return eid => {
      manager[manager._props[0]][eid] = flyweight[manager._props[0]]
      manager[manager._props[1]][eid] = flyweight[manager._props[1]]
      manager[manager._props[2]][eid] = flyweight[manager._props[2]]
      manager[manager._props[3]][eid] = flyweight[manager._props[3]]
      manager[manager._props[4]][eid] = flyweight[manager._props[4]]
      manager[manager._props[5]][eid] = flyweight[manager._props[5]]
      manager[manager._props[6]][eid] = flyweight[manager._props[6]]
      return flyweight
  }
  else if(manager._props.length == 8) return eid => {
      manager[manager._props[0]][eid] = flyweight[manager._props[0]]
      manager[manager._props[1]][eid] = flyweight[manager._props[1]]
      manager[manager._props[2]][eid] = flyweight[manager._props[2]]
      manager[manager._props[3]][eid] = flyweight[manager._props[3]]
      manager[manager._props[4]][eid] = flyweight[manager._props[4]]
      manager[manager._props[5]][eid] = flyweight[manager._props[5]]
      manager[manager._props[6]][eid] = flyweight[manager._props[6]]
      manager[manager._props[7]][eid] = flyweight[manager._props[7]]
      return flyweight
  }
  else if(manager._props.length == 9) return eid => {
      manager[manager._props[0]][eid] = flyweight[manager._props[0]]
      manager[manager._props[1]][eid] = flyweight[manager._props[1]]
      manager[manager._props[2]][eid] = flyweight[manager._props[2]]
      manager[manager._props[3]][eid] = flyweight[manager._props[3]]
      manager[manager._props[4]][eid] = flyweight[manager._props[4]]
      manager[manager._props[5]][eid] = flyweight[manager._props[5]]
      manager[manager._props[6]][eid] = flyweight[manager._props[6]]
      manager[manager._props[7]][eid] = flyweight[manager._props[7]]
      manager[manager._props[8]][eid] = flyweight[manager._props[8]]
      return flyweight
  }
  else if(manager._props.length == 10) return eid => {
      manager[manager._props[0]][eid] = flyweight[manager._props[0]]
      manager[manager._props[1]][eid] = flyweight[manager._props[1]]
      manager[manager._props[2]][eid] = flyweight[manager._props[2]]
      manager[manager._props[3]][eid] = flyweight[manager._props[3]]
      manager[manager._props[4]][eid] = flyweight[manager._props[4]]
      manager[manager._props[5]][eid] = flyweight[manager._props[5]]
      manager[manager._props[6]][eid] = flyweight[manager._props[6]]
      manager[manager._props[7]][eid] = flyweight[manager._props[7]]
      manager[manager._props[8]][eid] = flyweight[manager._props[8]]
      manager[manager._props[9]][eid] = flyweight[manager._props[9]]
      return flyweight
  }
}
