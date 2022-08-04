<template>
  <div id="app">
    <div>
    <el-form
        ref="form"
        :model="form"
        label-width="100px"
    >
      <el-row>
        <el-col :span="6"
        ><div>
          <el-form-item label="串口">
            <el-select
                v-model="form.port"
                filterable
                placeholder="请选择串口"
                :disabled="isDisable"
            >
              <el-option
                  v-for="item in portsList"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
              >
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="波特率">
            <el-select
                v-model="form.baudRate"
                filterable
                placeholder="请选择串口"
                :disabled="isDisable"
            >
              <el-option
                  v-for="item in loadAll"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
              >
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="数据位">
            <el-select
                v-model="form.dataBits"
                placeholder="请选择数据位"
                :disabled="isDisable"
            >
              <el-option label="7" value="7"></el-option>
              <el-option label="8" value="8"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="停止位">
            <el-select
                v-model="form.stopBits"
                placeholder="请选择停止位"
                :disabled="isDisable"
            >
              <el-option label="1" value="1"></el-option>
              <el-option label="2" value="2"></el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="校验位">
            <el-select
                v-model="form.parity"
                placeholder="请选择校验位"
                :disabled="isDisable"
            >
              <el-option label="None" value="None"></el-option>
              <el-option label="Even" value="Even"></el-option>
              <el-option label="Odd" value="Odd"></el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="流控制">
            <el-select
                v-model="form.flowControl"
                placeholder="请选择流控制"
                :disabled="isDisable"
            >
              <el-option label="None" value="None"></el-option>
              <el-option label="HardWare" value="HardWare"></el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="发送区设置">
            <el-radio-group v-model="form.type">
              <el-radio label="1">ASCII</el-radio>
              <el-radio label="2">HEX</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="发送信息">
            <el-input type="textarea" v-model="form.sendMsg"></el-input>
          </el-form-item>

          <el-form-item>
            <el-button :type="btnType" @click="connect" :disabled.sync="!form.port">{{
                btnText
              }}</el-button>
            <el-button type="info" @click="addAuthorize"
            >新增授权</el-button
            >
            <el-button type="" @click="close"
          >关闭连接</el-button
          >
            <el-button type="primary" @click="send">发送</el-button>
          </el-form-item>
        </div>
        </el-col>
        <el-col :span="15"
        ><div>
          <el-form-item label="电子秤信息">
            <el-input
                type="textarea"
                v-model="form.desc"
                disabled
                :autosize="{ minRows: 25, maxRows: 50 }"
            ></el-input>
          </el-form-item></div
        ></el-col>
      </el-row>
    </el-form>
  </div>
  </div>
</template>

<script>
import Serial from '@/utill/serial';

export default {

  name: 'app',
  data(){
    return{
        text: '', // 发送的文本
        reader: null, // 读取流
        writer: null, // 写入流
        decodeReader: '', //解析后读取数据字符串
        port: null, // 现在的串口
        baudRate: 9600, // 波特率
        dataBits: 8, // 每帧的数据位数(7或8)
        stopBits: 1, // 帧末尾的停止位数量(1或2)
        parity: 'none', // 校验模式，可以是none，偶数，奇数
        flowControl: 'none', // 流控模式(none或hardware)。
        Serial: Serial.getInstance(this),
      input: "",
      keepReading: true,
      form: {
        baudRate: "9600",
        dataBits: "8",
        stopBits: "1",
        parity: "None",
        flowControl: "None",
        desc: "",
        type: "1",
      },
      btnType: "primary",
      btnText: "连接串口",
      restaurants: [],
      portsList: [],
    }
  },
  computed: {
    isDisable() {
      return this.btnType == "danger";
    },
    loadAll() {
      this.$message.success("串口授权成功");
      return [
        { value: "110" },
        { value: "300" },
        { value: "600" },
        { value: "1200" },
        { value: "2400" },
        { value: "4800" },
        { value: "7200" },
        { value: "9600" },
        { value: "14400" },
        { value: "19200" },
        { value: "28800" },
        { value: "38400" },
        { value: "56000" },
        { value: "57600" },
        { value: "76800" },
        { value: "115200" },
        { value: "230400" },
        { value: "460800" },
      ];
    },

  },
  mounted() {
    this.initPort()
  },
  methods:{
    async initPort(){
      this.portsList = await this.Serial.getAuthorizePorts()
    },
    async addAuthorize(){
      this.portsList = await this.Serial.handleRequestPort()
    },
    async connect(){
      const {baudRate, dataBits, stopBits,parity, flowControl} = this.form
      await this.Serial.setConnectOptions({
        baudRate, // 波特率
        dataBits, // 每帧的数据位数(7或8)
        stopBits, // 停止位数(1或2)
        parity, // 校验模式，可以是none，偶数，奇数
        flowControl // 流控模式(none或hardware)。
      })
      await this.Serial.connect(this.portsList[this.form.port].port)
    },
    onMessage(msg){
      console.log(msg)
      this.form.desc+=msg
    },
    // async open(port){
    //
    //   //打开串口 设置波特率，发和收的波特率要一致
    //   try {
    //     await port.open()
    //     console.log('串口打开成功', port)
    //     // 获取读写流
    //     this.reader = await port.readable.getReader()
    //     this.writer = await port.writable.getWriter()
    //     await this.read(port)
    //   }catch (e) {
    //     console.log('串口打开失败', port, e)
    //   }
    //
    // },
    // async read(port){
    //   try{
    //     while(true){
    //       console.log('读取数据')
    //       const {value,done} = await this.reader.read()
    //       if (done || this.kill) {
    //         this.reader.releaseLock()
    //         this.reader = null
    //         break
    //       }
    //       // value 是一个 Uint8Array
    //       console.log('Uint8Array', value, this.writer, this.reader)
    //       //解码
    //       let decodeStr = this.Uint8ArrayToString(value)
    //       console.log(decodeStr)
    //     }
    //   }catch (error) {
    //     console.error(error)
    //   }finally {
    //     this.reader.releaseLock()
    //     this.reader = null
    //     console.log('关闭串口。')
    //     await port.close()
    //   }
    // },
    //
    async send(data){
      let that = this
      try {
        const u8a = new Uint8Array(data)
        console.log('u8a', u8a)
        await that.Serial.send(u8a)
      }catch (err){
        console.log(err)
        if (err.toString().indexOf('RangeError') > -1){
          alert('发送的数据不能超过10位')
        }
      }
    },
    close(){
       this.Serial.stopPort().then(result=>{
         console.log(result)
       }).catch(err=>{
         console.log(err.toString())
       })
    },

    // 发送
    async sendCommon() {
      if (this.myserialport.state.isOpen) {
        if (this.form.sendMsg.length !== 0) {
          const writeType = this.form.type;
          let value = this.form.sendMsg;
          let arr = [];
          if (writeType == 1) {
            // ASCII
            for (let i = 0; i < value.length; i++) {
              arr.push(this.myserialport.a2hex(value[i]));
            }
          } else if (writeType == 2) {
            // HEX
            if (/^[0-9A-Fa-f]+$/.test(value) && value.length % 2 === 0) {
              for (let i = 0; i < value.length; i = i + 2) {
                arr.push(parseInt(value.substring(i, i + 2), 16));
              }
            } else {
              this.$message.error("格式错误");
              return;
            }
          }
          this.myserialport.writeText(arr);
        } else {
          this.$message.warning("请输入发送的信息");
        }
      } else {
        this.$message.warning("串口处于关闭状态，请连接串口");
      }
    },

  },
}
</script>


<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}
</style>
