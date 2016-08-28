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
  def nvm = "export NVM_DIR=~/.nvm && source ~/.nvm/nvm.sh &>/dev/null && nvm use &>/dev/null"
  env.PATH = "${env.JAVA_HOME}/bin:${env.PATH}:/usr/local/bin:/usr/bin:/bin"

  // PRINT ENVIRONMENT TO JOB
  echo "workspace directory is $workspace"
  echo "build URL is $buildUrl"
  echo "build Number is $buildNumber"

  dir(projectHome) {
    stage 'Checkout'
    checkout scm

    stage 'Build'
    sh "${nvm} && npm install && npm run build"

    stage 'Unit-Tests'
    wrap([$class: 'Xvfb']) {
      try {
        sh "${nvm} && npm run test"
      } catch (err) {
        step([
          $class     : 'JUnitResultArchiver',
          testResults: 'target/surefire-reports/TESTS-*.xml'
        ])
        throw err
      }
    }
  }

  node('mac') {
    dir(projectHome) {

      checkout scm
      stage 'Integration-Tests'
      try {
        sh "${nvm} && npm install && npm run test-e2e"
      } catch (err) {
        throw err
      }

      stage 'build Apps'
      sh "${nvm} && node etc/release_notes.js ${buildNumber} && npm install && npm run package "
      sh "target && for file in *.ipa; do mv \$file \$(basename \$file .ipa)_build${buildNumber}.ipa; done && for file in *.apk; do mv \$file \$(basename \$file .apk)_build${buildNumber}.apk; done"


      stage 'upload Apps'
      sh '${nvm} && platforms/android && supply --apk ../../target/$(ls ../../target/ | grep apk) --json_key  ~/.flynn/playstore.json --package_name de.holisticon.app.flynn --track alpha'
      sh '${nvm} && platforms/ios && pilot upload --ipa ../../target/$(ls ../../target/ | grep ipa)'
      step([$class     : 'ArtifactArchiver',
            artifacts  : 'target/*.ipa, target/*.apk',
            fingerprint: true
      ])
    }
  }
}
