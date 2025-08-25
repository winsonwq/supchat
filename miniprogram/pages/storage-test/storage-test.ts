import { StorageService } from '../../lib/services/storage'

interface TestUser {
  id?: string
  name: string
  email: string
  age: number
  createdAt?: Date
}

Component({
  data: {
    testResults: [] as string[],
    loading: false,
  },

  methods: {
    addResult(message: string) {
      const timestamp = new Date().toLocaleTimeString()
      this.setData({
        testResults: [...this.data.testResults, `[${timestamp}] ${message}`]
      })
    },

    async testBasicOperations() {
      this.setData({ loading: true, testResults: [] })
      
      try {
        // 测试创建
        this.addResult('开始测试基础操作...')
        
        const storage = new StorageService()
        const userData: TestUser = {
          name: '测试用户',
          email: 'test@example.com',
          age: 25
        }
        
        const createResult = await storage.create(userData, { collection: 'test_users' })
        if (createResult.ok) {
          this.addResult(`✅ 创建成功: ${JSON.stringify(createResult.data)}`)
        } else {
          this.addResult(`❌ 创建失败: ${createResult.error}`)
        }
        
        // 测试获取
        const getResult = await storage.get<TestUser>('test_user_123', { collection: 'test_users' })
        if (getResult.ok) {
          this.addResult(`✅ 获取成功: ${JSON.stringify(getResult.data)}`)
        } else {
          this.addResult(`❌ 获取失败: ${getResult.error}`)
        }
        
        // 测试更新
        const updateResult = await storage.update<TestUser>(
          'test_user_123',
          { age: 26 },
          { collection: 'test_users' }
        )
        if (updateResult.ok) {
          this.addResult(`✅ 更新成功: ${JSON.stringify(updateResult.data)}`)
        } else {
          this.addResult(`❌ 更新失败: ${updateResult.error}`)
        }
        
        // 测试删除
        const deleteResult = await storage.delete('test_user_123', { collection: 'test_users' })
        if (deleteResult.ok) {
          this.addResult(`✅ 删除成功: ${deleteResult.data}`)
        } else {
          this.addResult(`❌ 删除失败: ${deleteResult.error}`)
        }
        
      } catch (error) {
        this.addResult(`❌ 测试异常: ${error}`)
      } finally {
        this.setData({ loading: false })
      }
    },

    async testBatchOperations() {
      this.setData({ loading: true })
      
      try {
        this.addResult('开始测试批量操作...')
        
        const storage = new StorageService()
        
        // 测试批量获取
        const batchResult = await storage.batchGet<TestUser>(
          ['user_1', 'user_2', 'user_3'],
          { collection: 'test_users' }
        )
        if (batchResult.ok) {
          this.addResult(`✅ 批量获取成功: ${JSON.stringify(batchResult.data)}`)
        } else {
          this.addResult(`❌ 批量获取失败: ${batchResult.error}`)
        }
        
        // 测试查询
        const queryResult = await storage.query<TestUser>(
          { age: { $gte: 18 } },
          { collection: 'test_users' }
        )
        if (queryResult.ok) {
          this.addResult(`✅ 查询成功: ${JSON.stringify(queryResult.data)}`)
        } else {
          this.addResult(`❌ 查询失败: ${queryResult.error}`)
        }
        
      } catch (error) {
        this.addResult(`❌ 批量操作测试异常: ${error}`)
      } finally {
        this.setData({ loading: false })
      }
    },

    async testStorageService() {
      this.setData({ loading: true })
      
      try {
        this.addResult('开始测试 StorageService 类...')
        
        const storage = new StorageService()
        
        const userData: TestUser = {
          name: '类测试用户',
          email: 'class@example.com',
          age: 30
        }
        
        const result = await storage.create(userData, { collection: 'test_users' })
        if (result.ok) {
          this.addResult(`✅ StorageService 创建成功: ${JSON.stringify(result.data)}`)
        } else {
          this.addResult(`❌ StorageService 创建失败: ${result.error}`)
        }
        
      } catch (error) {
        this.addResult(`❌ StorageService 测试异常: ${error}`)
      } finally {
        this.setData({ loading: false })
      }
    },

    clearResults() {
      this.setData({ testResults: [] })
    }
  }
})
