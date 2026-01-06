#!/bin/bash
cd /root/vcu-fuzzy-test-system/frontend

# 修复 InterfaceVerification.tsx
sed -i '/setTestCases(mockCases);/a\
\
  const handleRefresh = () => {\
    loadInterfaces();\
    loadTestCases();\
    console.log("刷新接口状态和测试用例");\
  };\
\
  const handleRunTests = () => {\
    const selectedCases = testCases.filter(c => c.interfaceId === selectedInterface);\
    selectedCases.forEach(case_ => {\
      setTestCases(prev => prev.map(tc => \
        tc.id === case_.id ? { ...tc, status: "running" as const } : tc\
      ));\
      setTimeout(() => {\
        setTestCases(prev => prev.map(tc => \
          tc.id === case_.id ? { ...tc, status: "passed" as const, responseTime: Math.floor(Math.random() * 100) + 10 } : tc\
        ));\
      }, 2000);\
    });\
    console.log("执行接口测试");\
  };\
\
  const handleRunTestCase = (testCaseId: string) => {\
    setTestCases(prev => prev.map(tc => \
      tc.id === testCaseId ? { ...tc, status: "running" as const } : tc\
    ));\
    setTimeout(() => {\
      setTestCases(prev => prev.map(tc => \
        tc.id === testCaseId ? { ...tc, status: "passed" as const, responseTime: Math.floor(Math.random() * 100) + 10 } : tc\
      ));\
    }, 2000);\
  };\
\
  const handleViewLogs = (testCaseId: string) => {\
    console.log(`查看测试用例日志: ${testCaseId}`);\
    alert(`查看测试用例 ${testCaseId} 的日志`);\
  };
' src/components/InterfaceVerification.tsx

# 修复按钮onClick
sed -i 's|<button className="px-4 py-2 bg-orange-600|<button onClick={handleRunTests} className="px-4 py-2 bg-orange-600|' src/components/InterfaceVerification.tsx
sed -i '/刷新状态<\/button>/{s|<button className="px-4 py-2 border-2|<button onClick={handleRefresh} className="px-4 py-2 border-2|;}' src/components/InterfaceVerification.tsx

echo "InterfaceVerification.tsx 修复完成"

