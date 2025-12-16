export const getPolygon = (latitude, longitude) => {
  const R_LAT = 0.0009;
  const R_LON = 0.0014;
  return [
    [longitude + R_LON, latitude + R_LAT], // coin haut droit
    [longitude + R_LON, latitude - R_LAT], // coin bas droit
    [longitude - R_LON, latitude - R_LAT], // coin bas gauche
    [longitude - R_LON, latitude + R_LAT], // coin haut gauche
    [longitude + R_LON, latitude + R_LAT], // fermeture sur le premier point
  ];
};

export const excludeMarker = (userPolygon, pointHautGauche, pointBasDroit) => {
  // Fonction d'exclusion de markers pour le calcul du trajet
  //   Si un marker est superposé au user, il sera exclus car l'API ORS renvoit une erreur sinon
  if (pointBasDroit[0] < userPolygon[3][0]) {
    // "ne se croisent pas car marqueur plus à gauche du user"
    return true; // pas de collision
  } else if (pointHautGauche[0] > userPolygon[1][0]) {
    // "ne se croisent pas car marqueur plus à droite du user"
    return true;
  } else if (pointBasDroit[1] > userPolygon[0][1]) {
    // "ne se croisent pas car marqueur plus en haut du user"
    return true;
  } else if (pointHautGauche[1] < userPolygon[1][1]) {
    // "ne se croisent pas car marqueur plus en bas du user"
    return true;
  }
  // Sinon, il y a collision/chevauchement donc exclusion du marker dans la requête
  return false;
};
