node {

  try {
    // Jenkins makes these variables available for each job it runs
    def buildNumber = env.BUILD_NUMBER
    def workspace = env.WORKSPACE
    def buildUrl = env.BUILD_URL
    def projectHome = 'app'

    // PRINT ENVIRONMENT TO JOB
    echo "workspace directory is $workspace"
    echo "build URL is $buildUrl"
    echo "build Number is $buildNumber"

    stage('Checkout') {
      git 'https://github.com/holisticon/flynn-book-scanner.git'
    }

    dir(projectHome) {
      stage('Build') {
        sh "npm install && npm run build"
      }
    }

    node('mac') {
      git 'https://github.com/holisticon/flynn-book-scanner.git'

      dir(projectHome) {

        stage('Unit-Tests') {
          try {
            sh "npm install && npm run test"
          } catch (exception) {
            rocketSend channel: 'website', emoji: ':rotating_light:', message: 'Unit-Test-Fehler'
            throw exception
          } finally {
            junit healthScaleFactor: 1.0, testResults: 'target/reports/TESTS-*.xml'
          }
        }

        stage('Integration-Tests') {
          try {
            sh "npm install" // TODO fix appoum tests && npm run test-e2e"
          } catch (exception) {
            rocketSend channel: 'website', emoji: ':rotating_light:', message: 'Integration-Test-Fehler'
            throw exception
          } finally {
            junit healthScaleFactor: 1.0, testResults: 'target/reports/TESTS-*.xml'
          }
        }

        stage('build Apps') {
          sh "node etc/release_notes.js ${buildNumber} && npm run clean && npm run package "
          sh "cd target && for file in *.ipa; do mv \$file \$(basename \$file .ipa)_build${buildNumber}.ipa; done && for file in *.apk; do mv \$file \$(basename \$file .apk)_build${buildNumber}.apk; done"
        }

        stage('upload Apps') {
          sh 'cd platforms/android && supply --apk ../../target/$(ls ../../target/ | grep apk) --json_key ~/.holisticon/playstore.json --package_name de.holisticon.app.flynn --track alpha'
          sh 'cd platforms/ios && pilot upload --ipa ../../target/$(ls ../../target/ | grep ipa)'
        }
        archiveArtifacts artifacts: 'target/*.ipa, target/*.apk'

      }
    }
  } catch (e) {
    rocketSend emoji: ':sob:', message: 'Fehler'
    throw e
  }

}
