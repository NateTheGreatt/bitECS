const rndRange = (min,max) => Math.random() * (max - min) + min

export default ({registerSystem}, width, height, length) => {

    let camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 5000 )
    camera.position.x = 600
    camera.position.y = 700
    camera.position.z = 0

    let scene = new THREE.Scene()
    scene.fog = new THREE.Fog( 0xFFFFFF, 1, 1000 )
    scene.background = new THREE.Color( 0xFFFFFF )

    let light = new THREE.PointLight( 0xFFFFFF )
    scene.add( light )

    let renderer = new THREE.WebGLRenderer( { antialias: true } )
    renderer.setPixelRatio( window.devicePixelRatio )
    renderer.setSize( window.innerWidth, window.innerHeight )
    document.body.appendChild( renderer.domElement )

    window.addEventListener( 'resize', () => {

        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()

        renderer.setSize( window.innerWidth, window.innerHeight )

    }, false )


    let material = new THREE.MeshBasicMaterial( { color: 0xfff, wireframe: true } )
    const createMesh = (w,h,l) => {
        let geometry = new THREE.BoxBufferGeometry(w,h,l)
        let mesh = new THREE.Mesh( geometry, material )
        return mesh
    }

    const meshMap = {}

    const addMesh = (eid,w,h,l) => {
        let mesh = createMesh(w,h,l)
        scene.add(mesh)
        meshMap[eid] = mesh
    }

    registerSystem({
        name: 'renderer', 
        components: ['position','size','visible'], 
        update: (p,s) => eid => {
            if(!meshMap[eid]) addMesh(eid,s.w[eid],s.h[eid],s.l[eid])
            meshMap[eid].position.x = p.x[eid] - s.w[eid]/2
            meshMap[eid].position.y = p.y[eid] - s.h[eid]/2
            meshMap[eid].position.z = p.z[eid] - s.l[eid]/2
        }
    })
    
    return {
        render: () => {
            camera.lookAt(new THREE.Vector3(width/2,height/2,length/2))
            renderer.render( scene, camera )
        }
    }

}