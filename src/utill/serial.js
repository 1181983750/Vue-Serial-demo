export default class Serial extends Object{
    /**
     * 此为单例模式 外面调用时 需要 Serial.getInstance()
     * @param {Object} that 上下文作用域
     * @returns {Object}
     */
    static getInstance(that){
        if (!Serial.instance){
            Serial.instance = new Serial(that)
        }
        return Serial.instance
    }

    constructor(that) {
        super();
        this._that = that;
        this.__init__();
    }

    __init__() {
        this.state = {
            port: null,
            readerStream:null,
            writerStream:null,
            stop: false,
            stopStatus: false,
            decodeStr:'',
            portIndex: undefined,
            ports: [],
            //port参数
            baudRate: "9600",
            dataBits: "8",
            stopBits: "1",
            parity: "none",
            flowControl: "none",
        };
        this.handleRequestPort = this.handleRequestPort.bind(this);
    }

    /**
     *
     * @param obj
     * @private
     */
    _setState(obj){
        /**
         * 设置连接选项
         * @param {String} baudRate: 波特率
         * @param {String} dataBits 数据位
         * @param {String} stopBits 停止位
         * @param {String} parity 校验位
         * @param {String} flowControl 流控制
         * @returns {null}
         */
        Object.keys(obj).forEach(key => {
            if (key === 'decodeStr'){
                this._that.onMessage(obj[key])
            }
            if(this.state[key] !== undefined){
                this.state[key] = obj[key]
            }else {
                throw Error(`state没有${key}无法赋值`)
            }
        });
    }

    _getState(key){
        if (Object.keys(this.state).indexOf(key) > -1) return this.state[key]
    }

    _freedReadLock(){
        this._getState('readerStream').releaseLock()
    }

    _freedWriteLock(){
        this._getState('writerStream').releaseLock()
    }

    setConnectOptions(options){
        /**
         * 设置连接选项
         * @param {String} baudRate: 波特率
         * @param {String} dataBits 数据位
         * @param {String} stopBits 停止位
         * @param {String} parity 校验位
         * @param {String} flowControl 流控制
         * @returns {Boolean}
         */
         this._setState({...options})
    }

    /**
     *
     * @returns {Promise<[]>}
     */
    async getAuthorizePorts() {
        // 获取已授权的全部串口
        let ports = []
        await navigator.serial.getPorts().then(ports__ => {
            ports__.map((item, index) =>{
                const { usbProductId, usbVendorId } = item.getInfo();
                if (usbProductId === undefined || usbVendorId === undefined) {
                    ports.push({label: '串口'+index, value:index, port:item})
                }else {
                    ports.push({label: usbProductId, value:index, port:item})
                }
            })
        }).catch(err =>{
            console.error(err.toString())
            return []
        });
        this._setState({
            ports,
        });
        return this._getState('ports')
    }

    /**
     *
     * @param port
     * @returns {Promise<Error>}
     */
    async connect(port){
        console.log(this.state)
        try {
            await port.open({
                baudRate: this._getState('baudRate'), // 波特率
                dataBits: this._getState('dataBits'), // 每帧的数据位数(7或8)
                stopBits: this._getState('stopBits'), // 停止位数(1或2)
                parity: this._getState('parity').toLowerCase(), // 校验模式，可以是none，偶数，奇数
                flowControl: this._getState('flowControl').toLowerCase()// 流控模式(none或hardware)。
            })
            console.log('串口打开成功', port)
            // 获取读写流
            this._setState({
                port,
                readerStream: await port.readable.getReader(),
                // writerStream: await port.writable.getWriter()
            })
            await this._read(port)
        }catch (e) {
            console.log('串口打开失败', port, e)
            this._that.$message.error("串口打开失败");
        }
    }

    async _read(port){
        try{
            while(true){
                console.log('读取数据', this._getState('port'))
                const {value,done} = await this._getState('readerStream').read()
                if (done || this._getState('stop')) {
                    await this._freedReadLock()
                    this._setState({readerStream: null,stopStatus: true, stop:false})
                    await port.close()
                    console.log('关闭串口完成。')
                    break
                }
                // value 是一个 Uint8Array
                // console.log('Uint8Array', value, this._getState('writerStream'), this._getState('readerStream'))
                //解码
                this._setState({decodeStr: this._Uint8ArrayToString(value)})
            }
        }catch (error) {
            console.error(error)
        }
    }

    async send(data){
        await this._getState('writerStream').write(data)
    }
    /**
     *
     * @param port
     * @returns {Promise<string>}
     */
    async stopPort(){
        let time = 0
        console.log('关闭串口中')
        this._setState({stop: true})
        if (this._getState('stopStatus')){
            this._setState({stopStatus: false})
            return 'closed of success';
        }
    }

    async handleRequestPort() {
        // 请求授权 叫用户选择
        try {
            await navigator.serial.requestPort()
        } catch (e) {
            if (e.toString().indexOf('No port selected by the user') > -1) alert('用户没有选择')
            else alert(e.toString());
        }
        return await this.getAuthorizePorts()

    }

    _Uint8ArrayToString(fileData){
        let dataString = "";
        if (!fileData) return dataString
        for (let i = 0; i < fileData.length; i++) {
            dataString += String.fromCharCode(fileData[i]);
        }
        return dataString
    }

}
