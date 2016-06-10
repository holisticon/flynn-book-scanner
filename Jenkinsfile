properties properties: [
  [$class: 'BuildDiscarderProperty', strategy: [$class: 'LogRotator', artifactDaysToKeepStr: '', artifactNumToKeepStr: '', daysToKeepStr: '20', numToKeepStr: '10']],
  [$class: 'GithubProjectProperty', displayName: '', projectUrlStr: 'https://github.com/holisticon/flynn-book-scanner/']
]

node {
  // Jenkins makes these variables available for each job it runs
  def buildNumber = env.BUILD_NUMBER
  def workspace = env.WORKSPACE
  def buildUrl = env.BUILD_URL
  env.PATH = "${env.JAVA_HOME}/bin:${env.PATH}:/usr/local/bin:/usr/bin:/bin"

  // PRINT ENVIRONMENT TO JOB
  echo "workspace directory is $workspace"
  echo "build URL is $buildUrl"
  echo "build Number is $buildNumber"

  stage 'Checkout'
  checkout scm

  stage 'Build'
  sh ". ~/.nvm/nvm.sh >/dev/null && cd app && npm install && grunt build"

  stage 'Unit-Tests'
  wrap([$class: 'Xvfb']) {
    try {
      sh ". ~/.nvm/nvm.sh >/dev/null && cd app && npm install && npm test"
    } catch (err) {
      step([
        $class     : 'JUnitResultArchiver',
        testResults: 'app/target/surefire-reports/TESTS-*.xml'
      ])
      throw err
    }
  }

  node('mac') {
    checkout scm
    stage 'Integration-Tests'
    try {
      sh ". ~/.nvm/nvm.sh >/dev/null && cd app && npm install && grunt e2e"
    } catch (err) {
      throw err
    }

    stage 'build Apps'
    sh ". ~/.nvm/nvm.sh >/dev/null && cd app && nvm install && nvm use && node etc/release_notes.js ${buildNumber} && npm install && grunt clean package"
    sh "cd app/target && for file in *.ipa; do mv \$file \$(basename \$file .ipa)_build${buildNumber}.ipa; done && for file in *.apk; do mv \$file \$(basename \$file .apk)_build${buildNumber}.apk; done"


    stage 'upload Apps'
    sh 'cd app/platforms/android && supply --apk ../../target/$(ls ../../target/ | grep apk) --json_key  ~/.flynn/playstore.json --package_name de.holisticon.app.flynn --track alpha'
    sh 'cd app/platforms/ios && pilot upload --ipa ../../target/$(ls ../../target/ | grep ipa)'
    step([$class     : 'ArtifactArchiver',
          artifacts  : 'app/target/*.ipa, app/target/*.apk',
          fingerprint: true
    ])
  }

}
