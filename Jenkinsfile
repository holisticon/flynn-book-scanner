properties properties: [
  [$class: 'BuildDiscarderProperty', strategy: [$class: 'LogRotator', artifactDaysToKeepStr: '', artifactNumToKeepStr: '', daysToKeepStr: '20', numToKeepStr: '10']],
  [$class: 'GithubProjectProperty', displayName: '', projectUrlStr: 'https://github.com/holisticon/flynn-book-scanner/']
]

node {
  // Jenkins makes these variables available for each job it runs
  def buildNumber = env.BUILD_NUMBER
  def workspace = env.WORKSPACE
  def buildUrl = env.BUILD_URL
  def projectHome = 'app'
  env.PATH = "${env.JAVA_HOME}/bin:${env.PATH}:/usr/local/bin:/usr/bin:/bin"

  // PRINT ENVIRONMENT TO JOB
  echo "workspace directory is $workspace"
  echo "build URL is $buildUrl"
  echo "build Number is $buildNumber"

  stage 'Checkout'
  checkout scm

  dir(projectHome) {

    stage 'Build'
    sh "npm install && npm run build"

    stage 'Unit-Tests'
    sh "npm run test"

    node('mac') {
      checkout scm
      stage 'Integration-Tests'
      sh "npm install && npm run test-e2e"

      stage 'build Apps'
      sh "node etc/release_notes.js ${buildNumber} && npm install && npm run package "
      sh "target && for file in *.ipa; do mv \$file \$(basename \$file .ipa)_build${buildNumber}.ipa; done && for file in *.apk; do mv \$file \$(basename \$file .apk)_build${buildNumber}.apk; done"

      stage 'upload Apps'
      sh 'cd platforms/android && supply --apk ../../target/$(ls ../../target/ | grep apk) --json_key  ~/.flynn/playstore.json --package_name de.holisticon.app.flynn --track alpha'
      sh 'cd platforms/ios && pilot upload --ipa ../../target/$(ls ../../target/ | grep ipa)'
      archiveArtifacts artifacts: 'target/*.ipa, target/*.apk'

    }

    junit healthScaleFactor: 1.0, testResults: 'target/surefire-reports/TEST-*.xml,target/failsafe-reports/TEST*.xml'
  }
}
