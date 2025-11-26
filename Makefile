CURRENT_DIR=$(shell pwd)

APP=$(shell basename ${CURRENT_DIR})

APP_CMD_DIR=${CURRENT_DIR}/cmd

REGISTRY=registry.delever.uz
TAG=latest
ENV_TAG=latest
PROJECT_NAME=delever

build-image:
	docker build --rm -t ${REGISTRY}/${PROJECT_NAME}/${APP}:${TAG} .
	docker tag ${REGISTRY}/${PROJECT_NAME}/${APP}:${TAG} ${REGISTRY}/${PROJECT_NAME}/${APP}:${ENV_TAG}

scan-image:
	trivy image -f json -o image-scan-report.json ${REGISTRY}/${PROJECT_NAME}/${APP}:${TAG}
	trivy image --exit-code 1 --ignore-unfixed --severity CRITICAL ${REGISTRY}/${PROJECT_NAME}/${APP}:${TAG}

push-image:
	docker push ${REGISTRY}/${PROJECT_NAME}/${APP}:${TAG}
	docker push ${REGISTRY}/${PROJECT_NAME}/${APP}:${ENV_TAG}

clear-image:
	docker rmi ${REGISTRY}/${PROJECT_NAME}/${APP}:${TAG}
	docker rmi ${REGISTRY}/${PROJECT_NAME}/${APP}:${ENV_TAG}

pull-proto-module:
	git submodule update --init --recursive

update-proto-module:
	git submodule update --remote --merge

# proto-gen:
# 	./scripts/gen-proto.sh  ${CURRENT_DIR}
# 	rm -rf vendor/genproto
# 	sudo rm -rf ${GOROOT}/src/genproto
# 	sudo cp -R genproto ${GOROOT}/src
# 	mv genproto vendor


copy-proto-module: # for node.js services
	rm -rf ${CURRENT_DIR}/protos
	mkdir ${CURRENT_DIR}/protos
	cp -R delever_protos/*_service* ${CURRENT_DIR}/protos