export default ({registerComponent}) => {
    
    const Vector3 = { x: 'float32', y: 'float32', z: 'float32' }
    registerComponent('position', Vector3)
    registerComponent('velocity', { ...Vector3, max: 'int8' })
    registerComponent('size', { w: 'float32', h: 'float32', l: 'float32' })
    registerComponent('visible')

}