import { useState } from "react"
import WelcomeScreen from "./screens/WelcomeScreen"
import Dashboard from "./screens/Dashboard"
import FeatureScreen from "./screens/FeatureScreen"

function App() {
  const [screen, setScreen] = useState("welcome")
  const [selectedFeature, setSelectedFeature] = useState(null)

  return (
    <>
      {screen === "welcome" && <WelcomeScreen setScreen={setScreen} />}

      {screen === "dashboard" && (
        <Dashboard
          setScreen={setScreen}
          setSelectedFeature={setSelectedFeature}
        />
      )}

      {screen === "feature" && (
        <FeatureScreen
          feature={selectedFeature}
          setScreen={setScreen}
        />
      )}
    </>
  )
}

export default App
