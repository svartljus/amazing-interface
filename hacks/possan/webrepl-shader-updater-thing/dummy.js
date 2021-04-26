import WebREPL from './webrepl.js'

let repl

const connect = () => {
    console.log('connect')

    repl = new WebREPL({
        ip: '192.168.1.149',
        password: 'repl',
        autoConnect: true,
        autoAuth: true,
        timeout: 5000
    })

    repl.on('authenticated', function() {
        console.log('authenticated')
        repl.enterRawRepl()
            .then(() => {
                // RAW REPL
            })
    })

    repl.on('output', function(msg) {
        console.log('output', msg)
    })
}

const sliderChanged = e => {
    console.log('slider changed', e, e.target)
    const k = e.target.dataset['var']
    const v = e.target.value
    const code = `${k}=${v}`
    console.log('execute code', code)
    repl.execFromString(code)
        .then(() => console.log('code executed'))
}

const sliderMoved = e => {
    // console.log('slider moved', e)

}

const sendShaderCode = () => {
    console.log('send shader code')
    const code = document.getElementById('shadercode').value
    repl.enterRawRepl()
        .then(() => repl.execRaw(code, 30))
        .then(() => repl.exitRawRepl(code))

}

const sendBootstrapCode = () => {
    console.log('send bootstrap code')
    const code = document.getElementById('bootstrapcode').value
    repl.enterRawRepl()
        .then(() => repl.execRaw(code, 30))
        .then(() => repl.exitRawRepl(code))
}

const sendReplCode = () => {
    console.log('send repl code')
    const code = document.getElementById('replcode').value
    repl.execFromString(code)
        .then(() => console.log('code executed'))
}

window.addEventListener('load', () => {
    document.getElementById('connect').addEventListener('click', connect)

    document.getElementById('r1').addEventListener('change', sliderChanged)
    document.getElementById('r1').addEventListener('mousemove', sliderMoved)
    document.getElementById('r2').addEventListener('change', sliderChanged)
    document.getElementById('r2').addEventListener('mousemove', sliderMoved)
    document.getElementById('r3').addEventListener('change', sliderChanged)
    document.getElementById('r3').addEventListener('mousemove', sliderMoved)
    document.getElementById('r4').addEventListener('change', sliderChanged)
    document.getElementById('r4').addEventListener('mousemove', sliderMoved)

    document.getElementById('sendshader').addEventListener('click', sendShaderCode)
    document.getElementById('sendbootstrap').addEventListener('click', sendBootstrapCode)
    document.getElementById('sendrepl').addEventListener('click', sendReplCode)

    connect()
})

