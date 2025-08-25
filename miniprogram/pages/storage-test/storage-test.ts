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
        testResults: [...this.data.testResults, `[${timestamp}] ${message}`],
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
          age: 25,
        }

        const createResult = await storage.create('/storage', userData)
        if (createResult.ok) {
          this.addResult(`✅ 创建成功: ${JSON.stringify(createResult.data)}`)

          // 获取创建的数据ID
          const createdId =
            (createResult.data as any)?.id || (createResult.data as any)?._id
          if (!createdId) {
            this.addResult(`❌ 创建的数据缺少ID`)
            return
          }

          // 测试获取
          const getResult = await storage.get<TestUser>('/storage/111?a=1&b=2')
          if (getResult.ok) {
            this.addResult(`✅ 获取成功: ${JSON.stringify(getResult.data)}`)
          } else {
            this.addResult(`❌ 获取失败: ${getResult.error}`)
          }

          // 测试更新
          const updateResult = await storage.update<TestUser>(
            '/storage/222',
            { age: 26 },
          )
          if (updateResult.ok) {
            this.addResult(`✅ 更新成功: ${JSON.stringify(updateResult.data)}`)
          } else {
            this.addResult(`❌ 更新失败: ${updateResult.error}`)
          }

          // 测试删除
          const deleteResult = await storage.delete('/storage/333')
          if (deleteResult.ok) {
            this.addResult(`✅ 删除成功: ${deleteResult.data}`)
          } else {
            this.addResult(`❌ 删除失败: ${deleteResult.error}`)
          }
        } else {
          this.addResult(`❌ 创建失败: ${createResult.error}`)
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

        // 先创建一些测试数据
        const testUsers = [
          { name: '用户1', email: 'user1@example.com', age: 20 },
          { name: '用户2', email: 'user2@example.com', age: 25 },
          { name: '用户3', email: 'user3@example.com', age: 30 },
        ]

        const createdIds: string[] = []

        for (const userData of testUsers) {
          const createResult = await storage.create('/storage', userData)
          if (
            createResult.ok &&
            ((createResult.data as any)?.id || (createResult.data as any)?._id)
          ) {
            createdIds.push(
              (createResult.data as any)?.id || (createResult.data as any)?._id,
            )
            this.addResult(`✅ 创建用户成功: ${userData.name}`)
          }
        }

        if (createdIds.length > 0) {
          // 测试逐个获取
          for (const id of createdIds) {
            const getResult = await storage.get<TestUser>('/storage')
            if (getResult.ok) {
              this.addResult(
                `✅ 获取用户成功: ${JSON.stringify(getResult.data)}`,
              )
            } else {
              this.addResult(`❌ 获取用户失败: ${getResult.error}`)
            }
          }

          // 清理测试数据
          for (const id of createdIds) {
            const deleteResult = await storage.delete('/storage')
            if (deleteResult.ok) {
              this.addResult(`✅ 删除用户成功: ${id}`)
            } else {
              this.addResult(`❌ 删除用户失败: ${deleteResult.error}`)
            }
          }
        } else {
          this.addResult(`❌ 无法创建测试数据用于批量操作`)
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
          age: 30,
        }

        const result = await storage.create('/storage', userData)
        if (result.ok) {
          this.addResult(
            `✅ StorageService 创建成功: ${JSON.stringify(result.data)}`,
          )

          // 清理测试数据
          const createdId =
            (result.data as any)?.id || (result.data as any)?._id
          if (createdId) {
            await storage.delete('/storage')
            this.addResult(`✅ 测试数据已清理`)
          }
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
    },
  },
})
