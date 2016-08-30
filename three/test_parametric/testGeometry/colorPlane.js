function colorPlane(planeGeo){
    var numFaces = planeGeo.faces.length;
    var offset = 0.0;
    for (i = 0;  i < numFaces; i++){
        var ii = (i+1) % (numFaces);
        //var j = (i+numX) % (numFaces);
        //var jj = (j+1) % (numFaces);
        // colors
        var coli = new THREE.Color();
        coli.setHSL((i/numFaces+offset)%1, 1, 0.5);
        var colii = new THREE.Color();
        colii.setHSL((ii/numFaces+offset)%1, 1, 0.5);
        var colj = new THREE.Color();
        colj.setHSL((ii/numFaces+offset)%1, 1, 0.5);
        //var coljj = new THREE.Color();
        //coljj.setHSL(jj/numTot, 1, 0.5);
        // face 1
        var face = planeGeo.faces[i];
        face.vertexColors[0] = coli;
        face.vertexColors[1] = colii;
        face.vertexColors[2] = colj;
        //planeGeo.faces.push(face);
    }
    return planeGeo;
}