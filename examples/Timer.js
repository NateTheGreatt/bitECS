export default () => {
    let then

    const start = () => {
        then = Date.now()
    }

    const check = (str='') => {
        console.log(str, Date.now() - then, 'ms')
        start()
    }

    return {
        start,
        check
    }
}
