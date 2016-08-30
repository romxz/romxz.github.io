function makeKlein(){
    var klein = new THREE.Geometry();

    /*
    geometry.vertices.push(
        new THREE.Vector3( -10,  10, 0 ),
        new THREE.Vector3( -10, -10, 0 ),
        new THREE.Vector3(  10, -10, 0 )
    );*/

    //geometry.faces.push( new THREE.Face3( 0, 1, 2 ) );

    //geometry.computeBoundingSphere();
    
    var u = 0, v = 0, i = 0;
    var numX = 50; var numY = 50;
    var numTot = numX*numY;//+numX+numY+1;
    var count = 0;
    for (v = 0;  v < 1; v += 1/numY){
        for (u = 0; u < 1; u += 1/numX){
            klein.vertices.push(THREE.ParametricGeometries['klein'](u,v));
            count++;
        }
    }
    log('vertex count:'); log(count);
    log('numX*numY:'); log(numTot);
    for (i = 0;  i <= numTot; i++){
        var ii = (i+1) % (numTot);
        var j = (i+numX) % (numTot);
        var jj = (j+1) % (numTot);
        klein.faces.push( new THREE.Face3(i, ii, j));
        klein.faces.push( new THREE.Face3(ii, jj, j));
    }
    
    return klein;
}