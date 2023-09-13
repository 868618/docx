<template>
  <div :class="['drag_area', { top20: list.length }]">
    <template v-if="!list.length">
      <h1 class="title">学道科技</h1>
      <div ref="holderEl" class="holder" @click="handleClick">
        <el-icon class="el-icon--upload" size="60" color="#529b2e">
          <upload-filled />
        </el-icon>

        <el-text class="mt-20" type="primary"> 拖动题库源文件到此 </el-text>
      </div>
    </template>

    <template v-else>
      <el-card>
        <el-row justify="center">
          <el-col :span="6"> <el-statistic title="总题量" :value="list.length" /></el-col>

          <el-col :span="6">
            <el-statistic title="目标题量" :value="result.all.length" value-style="color:red;"
          /></el-col>
        </el-row>

        <br />

        <el-form ref="ruleFormRef" :model="filters" label-width="120px" :rules="rules">
          <el-form-item label="科目名称" prop="name">
            <el-select
              v-model="filters.name"
              placeholder="请选择考试分类"
              clearable
              filterable
              style="width: 100%"
              @change="nameChange"
            >
              <el-option
                v-for="(item, index) in formData.names"
                :key="item"
                :label="item == '' ? '空' : item"
                :value="item"
              >
                <div style="overflow: hidden; width: 100%; text-overflow: ellipsis">
                  {{ index + 1 }}： {{ item }}
                </div>
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item v-if="filters.name.length" label="题型" prop="type">
            <el-select
              v-model="filters.type"
              placeholder="请选择题型"
              clearable
              multiple
              style="width: 100%"
            >
              <el-option
                v-for="item in formData.types"
                :key="item"
                :label="item == '' ? '空' : item"
                :value="item"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="数量" prop="total">
            <el-input v-model.number="filters.total" clearable :max="result.all.length" />
          </el-form-item>

          <el-form-item label="模式" prop="mode">
            <el-radio-group v-model="filters.mode">
              <el-radio :label="1">随机</el-radio>
              <el-radio :label="2">顺序</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item>
            <el-button :disabled="isDisabled" type="primary" @click="createWord(ruleFormRef)">
              生成word文档
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, watch } from 'vue'
import lodash from 'lodash'
import { ElLoading, ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'

interface IList {
  name: string
  type: string
  answer: string
  kind: string
  explain: string
  qzone: string
  school: string
  title: string
  time1: string
  time2: string
  grade: string
  class1: string
  class2: string
  option: string[]
}

const list = ref<IList[]>([])

interface RuleForm {
  types: string[]
  kinds: string[]
  names: string[]
}

const ruleFormRef = ref<FormInstance>()

const formData = reactive<RuleForm>({
  types: [],
  kinds: [],
  names: []
})

const validator = (rule, value: number, callback) => {
  if (value <= 0) {
    callback(new Error('题目不得小于0'))
  }

  if (value > result.all.length) {
    callback(new Error('题目不得大于' + result.all.length))
  }

  callback()
}

const rules = reactive({
  name: [{ required: true, message: '请输入科目名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择题型' }],
  total: [
    { required: true, message: '最少1题' },
    { type: 'number', validator: validator }
  ]
})

const filters = reactive<{
  name: string
  kind: string[]
  type: string[]
  total: number
  mode: 1 | 2
}>({
  type: [],
  kind: [],
  name: '',
  total: 100,
  mode: 1
})

const result = reactive<{ all: IList[]; kind: number; type: number; name: number }>({
  all: [],
  kind: 0,
  type: 0,
  name: 0
})

const isDisabled = ref(false)

watch([filters, list], ([nFilters]) => {
  // console.log('AT-[ nFilters &&&&&********** ]', nFilters)
  const { pickBy, union } = lodash
  const selected = pickBy(nFilters, (value) => typeof value == 'number' || value.length)
  console.log('AT-[ selected &&&&&********** ]', selected)

  // console.log('AT-[ elected.name &&&&&********** ]', selected.name)
  if (selected.name) {
    // formData.kinds = union(
    //   list.value.filter((item) => item.name == selected.name).map((item) => item.kind)
    // )
    console.log(
      'AT-[ pppppppp ]',
      list.value.filter((item) => item.name == selected.name)
    )
    formData.types = union(
      list.value.filter((item) => item.name == selected.name).map((item) => item.type)
    )
    console.log('AT-[ formData.types &&&&&********** ]', formData.types)
  }

  if (selected.type) {
    result.all = list.value
      .filter((item) => item.name == selected.name)
      // .filter((item) => nFilters.kind.some((k) => item.kind == k))
      .filter((item) => nFilters.type.some((t) => item.type == t))
    console.log('AT-[ result.all &&&&&********** ]', result.all)
  } else {
    result.all = []
  }

  isDisabled.value = !(selected.type && selected.name)
})

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const nameChange = () => {
  filters.kind = []
  filters.type = []
}

const handleClick = async () => {
  console.log('AT-[ handleClick &&&&&********** ]')
  const loading = ElLoading.service({
    lock: true,
    text: 'Loading',
    background: 'rgba(0, 0, 0, 0.7)'
  })

  window.api
    .selectFile<IList[]>()
    .then((res) => {
      console.log('AT-[ res &&&&&********** ]', res.length, res)
      list.value = res

      formData.names = lodash.union(res.map((item) => item.name))
      console.log('AT-[ formData.names &&&&&********** ]', formData.names)
    })
    .finally(() => {
      loading.close()
    })
}

const createWord = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.validate(async (valid) => {
    if (!valid) return
    const { name: title, mode, total } = filters

    let data = JSON.parse(JSON.stringify(result.all)).slice(0, total)
    if (mode == 1) {
      data = lodash.shuffle(data)
    } else {
      data = JSON.parse(JSON.stringify(result.all)).slice(0, total)
    }

    const { toPairs, groupBy } = lodash

    const obj = {
      title,
      list: toPairs(groupBy(data, 'type')).map(([title, detail]) => ({ title, detail }))
    }

    const loading = ElLoading.service({
      lock: true,
      text: '生成中...',
      background: 'rgba(0, 0, 0, 0.7)'
    })

    await window.api.createDocx(obj)

    loading.close()

    ElMessage({
      message: '导出到桌面成功了！',
      type: 'success'
    })
  })
}
</script>

<style scoped lang="scss">
.top20 {
  width: 90% !important;
  top: 25% !important;
  transform: translate(-50%, -25%) !important;
}
.drag_area {
  position: fixed;
  top: 50%;
  left: 50%;
  width: 400px;
  transform: translate(-50%, -50%);
  background: radial-gradient(transparent, rgba(255, 255, 255, 1) 2px);
  background-size: 4px 4px;
  // height: 400px;
  // background-color: red;

  .title {
    background: -webkit-linear-gradient(315deg, #42d392 25%, #647eff);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-size: 54px;
    letter-spacing: -0.5px;
    margin-bottom: 30px;
    text-align: center;
  }
}

.holder {
  width: 400px;
  height: 185px;
  border-radius: 3px;
  border: 1px dashed #ccc;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;

  cursor: pointer;

  position: relative;

  &:hover {
    border-color: #647eff;
  }

  .file {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    background-color: red;
    opacity: 0;
  }
}

.mt-20 {
  margin-top: 20px;
}
</style>
