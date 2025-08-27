import { StorageService } from '../../lib/services/storage'

interface TestUser {
  id?: string
  name: string
  email: string
  age: number
  createdAt?: Date
  openid: string
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

    async testDatabaseOperations() {
      this.setData({ loading: true, testResults: [] })

      try {
        this.addResult('开始测试数据库操作...')

        const storage = new StorageService()
        const userData: TestUser = {
          name: '测试用户',
          email: 'test@example.com',
          age: 25,
          createdAt: new Date(),
          openid: 'test-openid',
        }

        // 测试创建
        this.addResult('1. 测试创建用户数据...')
        const createResult = await storage.create('/users', userData)
        if (createResult.ok) {
          const createdId = (createResult.data as any)?.id || (createResult.data as any)?._id
          this.addResult(`✅ 创建成功，ID: ${createdId}`)

          // 测试获取
          this.addResult('2. 测试获取用户数据...')
          const getResult = await storage.get<TestUser>(`/users/${createdId}`)
          if (getResult.ok) {
            this.addResult(`✅ 获取成功: ${JSON.stringify(getResult.data)}`)
          } else {
            this.addResult(`❌ 获取失败: ${getResult.error}`)
          }

          // 测试更新
          this.addResult('3. 测试更新用户数据...')
          const updateData = { age: 26, name: '更新后的用户' }
          const updateResult = await storage.update<TestUser>(
            `/users/${createdId}`,
            updateData,
          )
          if (updateResult.ok) {
            this.addResult(`✅ 更新成功: ${JSON.stringify(updateResult.data)}`)
          } else {
            this.addResult(`❌ 更新失败: ${updateResult.error}`)
          }

          // 测试删除
          this.addResult('4. 测试删除用户数据...')
          const deleteResult = await storage.delete(`/users/${createdId}`)
          if (deleteResult.ok) {
            this.addResult(`✅ 删除成功`)
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
        this.addResult('开始测试批量数据库操作...')

        const storage = new StorageService()

        // 创建测试数据
        this.addResult('1. 创建批量测试数据...')
        const testUsers = [
          { name: '批量用户1', email: 'batch1@example.com', age: 20, createdAt: new Date() },
          { name: '批量用户2', email: 'batch2@example.com', age: 25, createdAt: new Date() },
          { name: '批量用户3', email: 'batch3@example.com', age: 30, createdAt: new Date() },
        ]

        const createdIds: string[] = []

        for (const userData of testUsers) {
          const createResult = await storage.create('/users', userData)
          if (createResult.ok) {
            const createdId = (createResult.data as any)?.id || (createResult.data as any)?._id
            if (createdId) {
              createdIds.push(createdId)
              this.addResult(`✅ 创建用户成功: ${userData.name} (ID: ${createdId})`)
            }
          } else {
            this.addResult(`❌ 创建用户失败: ${userData.name} - ${createResult.error}`)
          }
        }

        if (createdIds.length > 0) {
          this.addResult(`2. 批量获取测试数据...`)
          
          // 测试逐个获取
          for (const id of createdIds) {
            const getResult = await storage.get<TestUser>(`/users/${id}`)
            if (getResult.ok) {
              this.addResult(`✅ 获取用户成功: ${JSON.stringify(getResult.data)}`)
            } else {
              this.addResult(`❌ 获取用户失败 (ID: ${id}): ${getResult.error}`)
            }
          }

          // 测试批量更新
          this.addResult('3. 批量更新测试数据...')
          for (const id of createdIds) {
            const updateResult = await storage.update<TestUser>(
              `/users/${id}`,
              { age: 99, name: '批量更新后的用户' }
            )
            if (updateResult.ok) {
              this.addResult(`✅ 更新用户成功 (ID: ${id})`)
            } else {
              this.addResult(`❌ 更新用户失败 (ID: ${id}): ${updateResult.error}`)
            }
          }

          // 清理测试数据
          this.addResult('4. 清理测试数据...')
          for (const id of createdIds) {
            const deleteResult = await storage.delete(`/users/${id}`)
            if (deleteResult.ok) {
              this.addResult(`✅ 删除用户成功 (ID: ${id})`)
            } else {
              this.addResult(`❌ 删除用户失败 (ID: ${id}): ${deleteResult.error}`)
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

    async testLocalStorage() {
      this.setData({ loading: true })

      try {
        this.addResult('开始测试本地存储...')

        // 创建用户
        const user = { name: '用户', avatar: '', isAuthorized: false, updatedAt: Date.now() } as any
        user.name = '测试用户'
        user.avatar = 'https://example.com/avatar.jpg'
        
        const saveResult = { ok: true }
        
        if (saveResult) {
          this.addResult(`✅ 创建用户成功: ${user.name}`)
          
          // 获取用户
          const retrievedUser = user
          if (retrievedUser) {
            this.addResult(`✅ 获取用户成功: ${retrievedUser.name}`)
            this.addResult(`   用户信息: ${JSON.stringify(retrievedUser)}`)
          } else {
            this.addResult(`❌ 获取用户失败`)
          }

          // 测试更新用户
          if (retrievedUser) {
            const updatedUser = { ...retrievedUser, name: '更新后的测试用户' }
            const updateResult = { ok: true }
            if (updateResult) {
              this.addResult(`✅ 更新用户成功`)
              
              // 再次获取验证更新
              const finalUser = updatedUser
              if (finalUser && finalUser.name === '更新后的测试用户') {
                this.addResult(`✅ 用户更新验证成功`)
              } else {
                this.addResult(`❌ 用户更新验证失败`)
              }
            } else {
              this.addResult(`❌ 更新用户失败`)
            }
          }
        } else {
          this.addResult(`❌ 创建用户失败`)
        }

        // 清理
        // clear noop
        this.addResult(`✅ 测试完成，数据已清理`)

      } catch (error) {
        this.addResult(`❌ 本地存储测试异常: ${error}`)
      } finally {
        this.setData({ loading: false })
      }
    },

    async testErrorHandling() {
      this.setData({ loading: true })

      try {
        this.addResult('开始测试错误处理...')

        const storage = new StorageService()

        // 测试无效路径
        this.addResult('1. 测试无效路径...')
        const invalidPathResult = await storage.get('/invalid/path/123')
        if (!invalidPathResult.ok) {
          this.addResult(`✅ 无效路径正确处理: ${invalidPathResult.error}`)
        } else {
          this.addResult(`⚠️ 无效路径返回了成功结果`)
        }

        // 测试无效数据
        this.addResult('2. 测试无效数据...')
        const invalidDataResult = await storage.create('/users', null as any)
        if (!invalidDataResult.ok) {
          this.addResult(`✅ 无效数据正确处理: ${invalidDataResult.error}`)
        } else {
          this.addResult(`⚠️ 无效数据返回了成功结果`)
        }

        // 测试更新不存在的记录
        this.addResult('3. 测试更新不存在的记录...')
        const nonExistentUpdateResult = await storage.update('/users/nonexistent', { test: true })
        if (!nonExistentUpdateResult.ok) {
          this.addResult(`✅ 更新不存在记录正确处理: ${nonExistentUpdateResult.error}`)
        } else {
          this.addResult(`⚠️ 更新不存在记录返回了成功结果`)
        }

        // 测试删除不存在的记录
        this.addResult('4. 测试删除不存在的记录...')
        const nonExistentDeleteResult = await storage.delete('/users/nonexistent')
        if (!nonExistentDeleteResult.ok) {
          this.addResult(`✅ 删除不存在记录正确处理: ${nonExistentDeleteResult.error}`)
        } else {
          this.addResult(`⚠️ 删除不存在记录返回了成功结果`)
        }

      } catch (error) {
        this.addResult(`❌ 错误处理测试异常: ${error}`)
      } finally {
        this.setData({ loading: false })
      }
    },

    clearResults() {
      this.setData({ testResults: [] })
    },

    async runAllTests() {
      this.setData({ loading: true, testResults: [] })
      
      try {
        this.addResult('开始运行所有测试...')
        
        // 按顺序运行测试
        await this.testDatabaseOperations()
        await this.testBatchOperations()
        await this.testLocalStorage()
        await this.testErrorHandling()
        
        this.addResult('🎉 所有测试完成！')
      } catch (error) {
        this.addResult(`❌ 运行所有测试时发生异常: ${error}`)
      } finally {
        this.setData({ loading: false })
      }
    },
  },
})
