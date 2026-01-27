<template>
  <div id="app">
    <el-container>
      <!-- Header -->
      <el-header class="app-header">
        <div class="header-content">
          <h1 class="app-title">
            <span class="title-icon">◈</span>
            ArkUI 组件属性支持度大盘
          </h1>
          <div class="header-actions">
            <el-button type="primary" :icon="Refresh" @click="loadData" :loading="loading">
              刷新数据
            </el-button>
            <el-button type="success" :icon="Check" @click="saveData" :loading="saving" :disabled="!hasUnsavedChanges">
              保存修改
            </el-button>
          </div>
        </div>
      </el-header>

      <!-- Main Content -->
      <el-main class="app-main">
        <!-- Search and Filter -->
        <div class="toolbar">
          <el-input
            v-model="searchText"
            placeholder="搜索组件..."
            class="search-input"
            :prefix-icon="Search"
            clearable
          />
          <div class="stats">
            <el-tag type="info">组件: {{ filteredComponents.length }}</el-tag>
            <el-tag type="primary">属性: {{ matrixData.commonProperties.length }}</el-tag>
            <el-tag type="success">支持: {{ stats.supported }}</el-tag>
            <el-tag type="danger">不支持: {{ stats.unsupported }}</el-tag>
            <el-tag type="warning">未知: {{ stats.unknown }}</el-tag>
            <el-tag type="info" v-if="hasUnsavedChanges">⚠️ 有未保存修改</el-tag>
          </div>
        </div>

        <!-- Batch Operations -->
        <div class="batch-toolbar" v-if="selectedRows.length > 0">
          <span class="selection-info">已选择 {{ selectedRows.length }} 个组件</span>
          <el-button size="small" @click="batchUpdateStatus('supported')">批量标记为支持</el-button>
          <el-button size="small" @click="batchUpdateStatus('unsupported')">批量标记为不支持</el-button>
          <el-button size="small" @click="batchUpdateStatus('unknown')">批量标记为未知</el-button>
          <el-button size="small" type="danger" @click="clearSelection">取消选择</el-button>
        </div>

        <!-- Matrix Table -->
        <div class="table-container">
          <div v-if="loading && !isRenderReady" class="loading-state">
            <el-loading :active="true" />
            <p class="loading-text">正在加载数据...</p>
          </div>

          <div v-else class="table-content">
            <div class="table-tips">
              <el-alert type="info" :closable="false" show-icon>
                <template #default>
                  <div class="tips-content">
                    <p>💡 <strong>单击</strong>单元格切换状态 | <strong>右键</strong>查看菜单 | 横向滚动查看所有156个属性</p>
                  </div>
                </template>
              </el-alert>
            </div>

            <div class="matrix-scroll-wrapper">
              <table class="matrix-table-native">
                <thead>
                  <tr>
                    <th class="fixed-col checkbox-col">
                      <el-checkbox
                        :indeterminate="isIndeterminate"
                        v-model="selectAll"
                        @change="handleSelectAll"
                      />
                    </th>
                    <th class="fixed-col component-col">组件</th>
                    <th class="fixed-col owner-col">Owner</th>
                    <th
                      v-for="prop in matrixData.commonProperties"
                      :key="prop"
                      class="property-col"
                      :title="prop"
                    >
                      {{ prop }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(row, rowIndex) in paginatedComponents"
                    :key="row.name"
                    :class="{ 'selected': selectedRowsMap[row.name] }"
                    @click="toggleRowSelection(row)"
                  >
                    <td class="fixed-col checkbox-col">
                      <el-checkbox
                        :model-value="selectedRowsMap[row.name]"
                        @change="(val) => handleRowSelect(row, val)"
                        @click.stop
                      />
                    </td>
                    <td class="fixed-col component-col">
                      <div class="component-name">{{ row.name }}</div>
                    </td>
                    <td class="fixed-col owner-col">
                      <el-input
                        v-model="row.owner"
                        placeholder="未分配"
                        size="small"
                        @change="handleOwnerChange(row)"
                        @click.stop
                      />
                    </td>
                    <td
                      v-for="prop in matrixData.commonProperties"
                      :key="prop"
                      class="property-col"
                      @click="handleCellClick(row, prop)"
                      @contextmenu.prevent="handleContextMenu(row, prop, $event)"
                    >
                      <div
                        class="status-cell"
                        :class="getStatusClass(row.properties[prop])"
                        :title="`${row.name}.${prop}: ${getStatusText(row.properties[prop]?.isSupported)}`"
                      >
                        {{ getStatusIcon(row.properties[prop]) }}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Component Pagination -->
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="filteredComponents.length"
              layout="total, sizes, prev, pager, next, jumper"
              class="pagination"
              small
            />
          </div>
        </div>
      </el-main>

      <!-- Footer -->
      <el-footer class="app-footer">
        <div class="footer-content">
          <span v-if="matrixData.lastScanned">
            最后扫描: {{ formatDate(matrixData.lastScanned) }}
          </span>
          <span v-else>暂无扫描数据</span>
        </div>
      </el-footer>
    </el-container>

    <!-- Context Menu -->
    <div
      v-show="contextMenuVisible"
      :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px' }"
      class="context-menu"
      @click.stop
    >
      <div class="context-menu-item" @click="contextMenuUpdate('supported')">
        <span class="status-icon">✅</span>
        <span>支持</span>
      </div>
      <div class="context-menu-item" @click="contextMenuUpdate('unsupported')">
        <span class="status-icon">❌</span>
        <span>不支持</span>
      </div>
      <div class="context-menu-item" @click="contextMenuUpdate('unknown')">
        <span class="status-icon">⚠️</span>
        <span>未知</span>
      </div>
      <div class="context-menu-divider"></div>
      <div class="context-menu-item" @click="contextMenuShowDetail()">
        <span class="status-icon">📋</span>
        <span>查看详情</span>
      </div>
    </div>

    <!-- Property Detail Dialog -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="`属性详情 - ${currentDetail.component} / ${currentDetail.property}`"
      width="600px"
    >
      <el-descriptions :column="1" border>
        <el-descriptions-item label="组件">
          {{ currentDetail.component }}
        </el-descriptions-item>
        <el-descriptions-item label="属性">
          {{ currentDetail.property }}
        </el-descriptions-item>
        <el-descriptions-item label="支持状态">
          <el-tag :type="getStatusTagType(currentDetail.data?.isSupported)">
            {{ getStatusText(currentDetail.data?.isSupported) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="数据来源">
          {{ currentDetail.data?.source === 'manual' ? '手动修改' : '自动扫描' }}
        </el-descriptions-item>
        <el-descriptions-item label="Owner">
          {{ currentDetail.data?.owner || '未分配' }}
        </el-descriptions-item>
        <el-descriptions-item label="最后更新">
          {{ currentDetail.data?.lastUpdated ? formatDate(currentDetail.data.lastUpdated) : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="备注">
          {{ currentDetail.data?.notes || '-' }}
        </el-descriptions-item>
      </el-descriptions>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus';
import { Refresh, Check, Search } from '@element-plus/icons-vue';
import { getMatrix, saveMatrix, updateProperty, type SupportMatrix, type ComponentInfo, type PropertySupport } from '@/api';

// Data
const matrixData = ref<SupportMatrix>({
  components: {},
  commonProperties: [],
  lastScanned: null
});

const loading = ref(true);
const saving = ref(false);
const searchText = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const selectedRowsMap = ref<Record<string, boolean>>({});
const selectedRows = ref<any[]>([]);
const hasUnsavedChanges = ref(false);
const isRenderReady = ref(false);

// Context Menu
const contextMenuVisible = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const contextMenuTarget = ref<{ row: any; prop: string } | null>(null);

// Detail Dialog
const detailDialogVisible = ref(false);
const currentDetail = ref({
  component: '',
  property: '',
  data: null as PropertySupport | null
});

// Computed
const components = computed(() => {
  return Object.values(matrixData.value.components).map(comp => ({
    name: comp.name,
    properties: comp.properties,
    owner: Object.values(comp.properties)[0]?.owner || ''
  }));
});

const filteredComponents = computed(() => {
  if (!searchText.value) return components.value;
  const search = searchText.value.toLowerCase();
  return components.value.filter(comp =>
    comp.name.toLowerCase().includes(search)
  );
});

const paginatedComponents = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredComponents.value.slice(start, end);
});

const selectAll = computed({
  get: () => {
    return paginatedComponents.value.length > 0 &&
           paginatedComponents.value.every(row => selectedRowsMap.value[row.name]);
  },
  set: (val) => {
    // handled in handleSelectAll
  }
});

const isIndeterminate = computed(() => {
  const selectedCount = Object.values(selectedRowsMap.value).filter(Boolean).length;
  return selectedCount > 0 && selectedCount < paginatedComponents.value.length;
});

const stats = computed(() => {
  let supported = 0;
  let unsupported = 0;
  let unknown = 0;

  components.value.forEach(comp => {
    Object.values(comp.properties).forEach((prop: PropertySupport) => {
      if (prop.isSupported === 'supported') supported++;
      else if (prop.isSupported === 'unsupported') unsupported++;
      else unknown++;
    });
  });

  return { supported, unsupported, unknown };
});

// Methods
async function loadData() {
  loading.value = true;
  try {
    const data = await getMatrix();
    matrixData.value = data;
    hasUnsavedChanges.value = false;
    isRenderReady.value = true;
    console.log('数据加载成功，组件数量:', Object.keys(data.components).length, '属性数量:', data.commonProperties.length);
  } catch (error) {
    ElMessage.error('加载数据失败');
    console.error('加载错误:', error);
  } finally {
    loading.value = false;
  }
}

async function saveData() {
  saving.value = true;
  try {
    await saveMatrix(matrixData.value);
    hasUnsavedChanges.value = false;
    ElMessage.success('数据保存成功');
  } catch (error) {
    ElMessage.error('保存数据失败');
    console.error(error);
  } finally {
    saving.value = false;
  }
}

async function updateComponentProperty(
  componentName: string,
  propertyName: string,
  newStatus: string
) {
  const comp = components.value.find(c => c.name === componentName);
  if (!comp) return;

  comp.properties[propertyName] = {
    ...comp.properties[propertyName],
    isSupported: newStatus as any,
    source: 'manual',
    lastUpdated: new Date().toISOString()
  };

  hasUnsavedChanges.value = true;

  try {
    await updateProperty(componentName, propertyName, comp.properties[propertyName]);
  } catch (error) {
    ElMessage.error('更新失败');
    console.error(error);
  }
}

function handleCellClick(row: any, prop: string) {
  const currentStatus = row.properties[prop]?.isSupported || 'unknown';
  const statusMap = ['supported', 'unsupported', 'unknown'];
  const currentIndex = statusMap.indexOf(currentStatus);
  const newStatus = statusMap[(currentIndex + 1) % statusMap.length] as any;
  updateComponentProperty(row.name, prop, newStatus);
}

function handleContextMenu(row: any, prop: string, event: MouseEvent) {
  contextMenuTarget.value = { row, prop };
  contextMenuX.value = event.clientX;
  contextMenuY.value = event.clientY;
  contextMenuVisible.value = true;
}

function contextMenuUpdate(status: string) {
  if (contextMenuTarget.value) {
    updateComponentProperty(contextMenuTarget.value.row.name, contextMenuTarget.value.prop, status);
  }
  contextMenuVisible.value = false;
}

function contextMenuShowDetail() {
  if (contextMenuTarget.value) {
    showDetail(contextMenuTarget.value.row, contextMenuTarget.value.prop);
  }
  contextMenuVisible.value = false;
}

function showDetail(row: any, prop: string) {
  currentDetail.value = {
    component: row.name,
    property: prop,
    data: row.properties[prop]
  };
  detailDialogVisible.value = true;
}

function handleRowSelect(row: any, selected: boolean) {
  if (selected) {
    selectedRowsMap.value[row.name] = true;
    selectedRows.value.push(row);
  } else {
    delete selectedRowsMap.value[row.name];
    selectedRows.value = selectedRows.value.filter(r => r.name !== row.name);
  }
}

function toggleRowSelection(row: any) {
  if (selectedRowsMap.value[row.name]) {
    delete selectedRowsMap.value[row.name];
    selectedRows.value = selectedRows.value.filter(r => r.name !== row.name);
  } else {
    selectedRowsMap.value[row.name] = true;
    selectedRows.value.push(row);
  }
}

function handleSelectAll(val: boolean) {
  selectedRowsMap.value = {};
  selectedRows.value = [];
  if (val) {
    paginatedComponents.value.forEach(row => {
      selectedRowsMap.value[row.name] = true;
      selectedRows.value.push(row);
    });
  }
}

function clearSelection() {
  selectedRowsMap.value = {};
  selectedRows.value = [];
}

async function batchUpdateStatus(status: string) {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择组件');
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要将选中的 ${selectedRows.value.length} 个组件的所有属性批量更新为 "${getStatusText(status as any)}" 吗？`,
      '批量确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    const propertiesToUpdate = matrixData.value.commonProperties;
    const totalUpdates = selectedRows.value.length * propertiesToUpdate.length;
    let completedUpdates = 0;

    const loadingInstance = ElLoading.service({
      lock: true,
      text: `正在更新: 0 / ${totalUpdates}`,
      background: 'rgba(0, 0, 0, 0.7)'
    });

    try {
      const updatePromises: Promise<void>[] = [];

      for (const row of selectedRows.value) {
        for (const prop of propertiesToUpdate) {
          const promise = updateComponentProperty(row.name, prop, status).then(() => {
            completedUpdates++;
            if (completedUpdates % 50 === 0 || completedUpdates === totalUpdates) {
              loadingInstance.text = `正在更新: ${completedUpdates} / ${totalUpdates}`;
            }
          });
          updatePromises.push(promise);
        }
      }

      await Promise.all(updatePromises);
      ElMessage.success(`已批量更新 ${totalUpdates} 个属性`);
    } finally {
      loadingInstance.close();
    }

  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量更新失败:', error);
    }
  }
}

function handleOwnerChange(row: any) {
  hasUnsavedChanges.value = true;
  ElMessage.success(`${row.name} 的 Owner 已更新`);
}

function getStatusClass(prop: PropertySupport | undefined): string {
  if (!prop) return 'status-unknown';
  return `status-${prop.isSupported}`;
}

function getStatusIcon(prop: PropertySupport | undefined): string {
  if (!prop) return '⚠️';
  switch (prop.isSupported) {
    case 'supported': return '✅';
    case 'unsupported': return '❌';
    default: return '⚠️';
  }
}

function getStatusText(status: any): string {
  switch (status) {
    case 'supported': return '支持';
    case 'unsupported': return '不支持';
    case 'unknown': return '未知';
    default: return '未知';
  }
}

function getStatusTagType(status: any): string {
  switch (status) {
    case 'supported': return 'success';
    case 'unsupported': return 'danger';
    case 'unknown': return 'warning';
    default: return 'info';
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN');
}

// Close context menu when clicking outside
function handleGlobalClick() {
  contextMenuVisible.value = false;
}

// Lifecycle
onMounted(() => {
  loadData();
  document.addEventListener('click', handleGlobalClick);
});

onUnmounted(() => {
  document.removeEventListener('click', handleGlobalClick);
});
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.app-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.app-title {
  font-size: 24px;
  font-weight: 700;
  color: #667eea;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-icon {
  font-size: 28px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.app-main {
  padding: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.search-input {
  width: 300px;
}

.stats {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.batch-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  padding: 10px 15px;
  background: #f0f9ff;
  border: 1px solid #3b82f6;
  border-radius: 8px;
}

.selection-info {
  font-weight: 600;
  color: #3b82f6;
  margin-right: 10px;
}

.table-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  min-height: 400px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.loading-text {
  margin-top: 20px;
  color: #666;
}

.table-content {
  width: 100%;
}

.table-tips {
  margin-bottom: 15px;
}

.tips-content p {
  margin: 0;
  font-size: 14px;
}

.matrix-scroll-wrapper {
  overflow-x: auto;
  overflow-y: visible;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  position: relative;
}

.matrix-table-native {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.matrix-table-native thead {
  position: sticky;
  top: 0;
  z-index: 10;
}

.matrix-table-native th,
.matrix-table-native td {
  padding: 8px 4px;
  text-align: center;
  border: 1px solid #dcdfe6;
  white-space: nowrap;
}

.matrix-table-native th {
  background: #f5f7fa;
  font-weight: 600;
  color: #303133;
  user-select: none;
}

.matrix-table-native tbody tr {
  transition: background-color 0.2s;
}

.matrix-table-native tbody tr:hover {
  background-color: #f5f7fa;
}

.matrix-table-native tbody tr.selected {
  background-color: #ecf5ff;
}

.fixed-col {
  position: sticky;
  z-index: 5;
  background: white;
}

.checkbox-col {
  left: 0;
  width: 50px;
  min-width: 50px;
}

.component-col {
  left: 50px;
  width: 120px;
  min-width: 120px;
}

.owner-col {
  left: 170px;
  width: 130px;
  min-width: 130px;
}

.property-col {
  padding: 0;
}

.component-name {
  font-weight: 600;
  color: #667eea;
}

.status-cell {
  display: inline-block;
  width: 100%;
  min-height: 32px;
  line-height: 32px;
  cursor: pointer;
  user-select: none;
  font-size: 16px;
  transition: all 0.15s ease;
}

.status-cell:hover {
  transform: scale(1.15);
  background: rgba(0, 0, 0, 0.05);
}

.status-supported {
  color: #67c23a;
}

.status-unsupported {
  color: #f56c6c;
}

.status-unknown {
  color: #e6a23c;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.app-footer {
  background: rgba(255, 255, 255, 0.95);
  text-align: center;
  color: #606266;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.footer-content {
  line-height: 60px;
}

/* Context Menu */
.context-menu {
  position: fixed;
  z-index: 9999;
  background: white;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  min-width: 140px;
  padding: 4px 0;
}

.context-menu-item {
  padding: 8px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s;
}

.context-menu-item:hover {
  background-color: #f5f7fa;
}

.context-menu-divider {
  height: 1px;
  background-color: #dcdfe6;
  margin: 4px 0;
}

.status-icon {
  font-size: 16px;
  min-width: 20px;
}

.status-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-option.supported {
  color: #67c23a;
}

.status-option.unsupported {
  color: #f56c6c;
}

.status-option.unknown {
  color: #e6a23c;
}
</style>
